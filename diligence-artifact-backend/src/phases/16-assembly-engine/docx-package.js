import { deflateRawSync, inflateRawSync } from "node:zlib";

const ZIP_SIGNATURE = Object.freeze({
  LOCAL: 0x04034b50,
  CENTRAL: 0x02014b50,
  EOCD: 0x06054b50
});

export const DOCX_PACKAGE_ASSEMBLER_VERSION = "phase16_docx_package_assembler.v1";

export function assembleDocxTemplate(templateBuffer, {
  placeholder_bindings = [],
  action_tokens = []
} = {}) {
  const replacements = new Map();
  for (const binding of [...placeholder_bindings, ...action_tokens]) {
    if (!binding?.token) continue;
    const value = binding.value ?? binding.disposition ?? "";
    replacements.set(binding.token, formatDocumentValue(value));
  }

  const entries = readZipEntries(templateBuffer).map((entry) => ({
    ...entry,
    data: Buffer.from(entry.data)
  }));
  let tokenReplacementCount = 0;
  let internalSectionResult = null;

  for (const entry of entries) {
    if (!entry.name.endsWith(".xml")) continue;
    let xml = entry.data.toString("utf8");
    for (const [token, value] of replacements) {
      const result = replaceTokenAcrossTextNodes(xml, token, value);
      xml = result.xml;
      tokenReplacementCount += result.count;
    }
    if (entry.name === "word/document.xml") {
      internalSectionResult = removeInternalDeliverySections(xml);
      xml = internalSectionResult.xml;
    }
    entry.data = Buffer.from(xml, "utf8");
  }

  const remainingTokens = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(".xml")) continue;
    const matches = extractText(entry.data.toString("utf8")).match(/\{\{QR\.[^}]+\}\}/g) || [];
    remainingTokens.push(...matches);
  }
  if (remainingTokens.length) {
    throw new Error(`DOCX_QR_TOKENS_UNRESOLVED:${[...new Set(remainingTokens)].join("|")}`);
  }
  if (!internalSectionResult?.control_schedule_removed) {
    throw new Error("DOCX_QR_CONTROL_SCHEDULE_NOT_FOUND");
  }

  const output = writeZipEntries(entries);
  const verification = verifyDocxPackage(output);
  return Object.freeze({
    buffer: output,
    stats: Object.freeze({
      assembler_version: DOCX_PACKAGE_ASSEMBLER_VERSION,
      token_replacement_count: tokenReplacementCount,
      control_schedule_removed: true,
      architect_notes_removed: internalSectionResult.architect_notes_removed,
      production_notes_removed: internalSectionResult.production_notes_removed,
      remaining_qr_token_count: 0,
      zip_entry_count: entries.length,
      package_verification: verification
    })
  });
}

export function readZipEntries(buffer) {
  const source = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || "");
  const eocd = findEocd(source);
  const totalEntries = source.readUInt16LE(eocd + 10);
  const centralOffset = source.readUInt32LE(eocd + 16);
  const entries = [];
  let cursor = centralOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (source.readUInt32LE(cursor) !== ZIP_SIGNATURE.CENTRAL) {
      throw new Error(`ZIP_CENTRAL_SIGNATURE_INVALID:${index}`);
    }
    const flags = source.readUInt16LE(cursor + 8);
    const method = source.readUInt16LE(cursor + 10);
    const time = source.readUInt16LE(cursor + 12);
    const date = source.readUInt16LE(cursor + 14);
    const compressedSize = source.readUInt32LE(cursor + 20);
    const uncompressedSize = source.readUInt32LE(cursor + 24);
    const nameLength = source.readUInt16LE(cursor + 28);
    const extraLength = source.readUInt16LE(cursor + 30);
    const commentLength = source.readUInt16LE(cursor + 32);
    const externalAttributes = source.readUInt32LE(cursor + 38);
    const localOffset = source.readUInt32LE(cursor + 42);
    if (flags & 1) throw new Error("ZIP_ENCRYPTED_ENTRY_FORBIDDEN");
    if ([compressedSize, uncompressedSize, localOffset].includes(0xffffffff)) {
      throw new Error("ZIP64_UNSUPPORTED");
    }

    const name = source.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    if (source.readUInt32LE(localOffset) !== ZIP_SIGNATURE.LOCAL) {
      throw new Error(`ZIP_LOCAL_SIGNATURE_INVALID:${name}`);
    }
    const localNameLength = source.readUInt16LE(localOffset + 26);
    const localExtraLength = source.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = source.subarray(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = inflateRawSync(compressed);
    else throw new Error(`ZIP_COMPRESSION_UNSUPPORTED:${name}:${method}`);
    if (data.length !== uncompressedSize) {
      throw new Error(`ZIP_UNCOMPRESSED_SIZE_MISMATCH:${name}`);
    }

    entries.push({
      name,
      data,
      method: name.endsWith("/") ? 0 : method,
      time,
      date,
      externalAttributes
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

export function writeZipEntries(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.from(entry.data || "");
    const method = entry.name.endsWith("/") ? 0 : entry.method === 0 ? 0 : 8;
    const compressed = method === 0 ? data : deflateRawSync(data, { level: 6 });
    const crc = crc32(data);
    const flags = 0x800;
    const time = entry.time || 0;
    const date = entry.date || 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(ZIP_SIGNATURE.LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(ZIP_SIGNATURE.CENTRAL, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(entry.externalAttributes || 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + compressed.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(ZIP_SIGNATURE.EOCD, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

export function replaceTokenAcrossTextNodes(xml, token, replacement) {
  let updated = xml;
  let count = 0;
  for (;;) {
    const nodes = textNodes(updated);
    const plainText = nodes.map((node) => node.text).join("");
    const tokenStart = plainText.indexOf(token);
    if (tokenStart < 0) break;
    const tokenEnd = tokenStart + token.length;
    let cursor = 0;
    let startIndex = -1;
    let endIndex = -1;
    let startOffset = 0;
    let endOffset = 0;
    for (let index = 0; index < nodes.length; index += 1) {
      const next = cursor + nodes[index].text.length;
      if (startIndex < 0 && tokenStart >= cursor && tokenStart < next) {
        startIndex = index;
        startOffset = tokenStart - cursor;
      }
      if (tokenEnd > cursor && tokenEnd <= next) {
        endIndex = index;
        endOffset = tokenEnd - cursor;
        break;
      }
      cursor = next;
    }
    if (startIndex < 0 || endIndex < 0) {
      throw new Error(`DOCX_TOKEN_NODE_MAPPING_FAILED:${token}`);
    }
    if (startIndex === endIndex) {
      nodes[startIndex].text = `${nodes[startIndex].text.slice(0, startOffset)}${replacement}${nodes[startIndex].text.slice(endOffset)}`;
    } else {
      nodes[startIndex].text = `${nodes[startIndex].text.slice(0, startOffset)}${replacement}`;
      for (let index = startIndex + 1; index < endIndex; index += 1) nodes[index].text = "";
      nodes[endIndex].text = nodes[endIndex].text.slice(endOffset);
    }
    updated = rebuildXml(updated, nodes);
    count += 1;
  }
  return { xml: updated, count };
}

export function removeInternalDeliverySections(xml) {
  const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    text: normalizeBlockText(extractText(match[0]))
  }));
  const sectionProperties = xml.indexOf("<w:sectPr");
  const bodyClose = xml.indexOf("</w:body>");
  const bodyEnd = sectionProperties >= 0 ? sectionProperties : bodyClose;
  const find = (predicate) => paragraphs.find((paragraph) => predicate(paragraph.text));
  const scheduleStart = find((text) => text.includes("QR ASSEMBLY CONTROL SCHEDULE") && !text.includes("END QR"));
  const scheduleEnd = find((text) => text.includes("END QR ASSEMBLY CONTROL SCHEDULE"));
  const production = find((text) => /^(ANNEXURE\s+C\s*[-—:]\s*)?PRODUCTION NOTES$/.test(text));
  const architect = find((text) => /^(ANNEXURE\s+B\s*[-—:]\s*)?ARCHITECT NOTES$/.test(text));
  const ranges = [];
  if (architect) ranges.push([architect.start, production?.start ?? scheduleStart?.start ?? bodyEnd]);
  if (production) ranges.push([production.start, scheduleStart?.start ?? bodyEnd]);
  if (scheduleStart && scheduleEnd) ranges.push([scheduleStart.start, scheduleEnd.end]);

  const merged = ranges
    .filter(([start, end]) => Number.isInteger(start) && Number.isInteger(end) && end > start)
    .sort((left, right) => left[0] - right[0])
    .reduce((output, range) => {
      const previous = output.at(-1);
      if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
      else output.push([...range]);
      return output;
    }, []);

  let updated = xml;
  for (const [start, end] of merged.reverse()) updated = `${updated.slice(0, start)}${updated.slice(end)}`;
  return {
    xml: updated,
    control_schedule_removed: Boolean(scheduleStart && scheduleEnd),
    architect_notes_removed: Boolean(architect),
    production_notes_removed: Boolean(production)
  };
}

export function extractText(xml) {
  return textNodes(xml).map((node) => node.text).join("");
}

export function verifyDocxPackage(buffer) {
  const entries = readZipEntries(buffer);
  const names = new Set(entries.map((entry) => entry.name));
  const errors = [];
  for (const required of ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]) {
    if (!names.has(required)) errors.push(`DOCX_REQUIRED_ENTRY_MISSING:${required}`);
  }
  const document = entries.find((entry) => entry.name === "word/document.xml");
  if (document) {
    const xml = document.data.toString("utf8");
    const text = extractText(xml);
    if (text.includes("QR ASSEMBLY CONTROL SCHEDULE")) errors.push("DOCX_QR_CONTROL_SCHEDULE_REMAINS");
    if (/\{\{QR\.[^}]+\}\}/.test(text)) errors.push("DOCX_QR_TOKEN_REMAINS");
    const headings = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => normalizeBlockText(extractText(match[0])));
    if (headings.some((heading) => /^(ANNEXURE\s+B\s*[-—:]\s*)?ARCHITECT NOTES$/.test(heading))) {
      errors.push("DOCX_ARCHITECT_NOTES_HEADING_REMAINS");
    }
    if (headings.some((heading) => /^(ANNEXURE\s+C\s*[-—:]\s*)?PRODUCTION NOTES$/.test(heading))) {
      errors.push("DOCX_PRODUCTION_NOTES_HEADING_REMAINS");
    }
  }
  if (errors.length) throw new Error(`DOCX_PACKAGE_VERIFICATION_FAILED:${errors.join("|")}`);
  return Object.freeze({ status: "PASS", entry_count: entries.length, errors: [] });
}

export function formatDocumentValue(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(formatDocumentValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, child]) => `${humanize(key)}: ${formatDocumentValue(child)}`).join("; ");
  }
  return String(value);
}

function textNodes(xml) {
  const output = [];
  const pattern = /<(?:w|a):t\b[^>]*>[\s\S]*?<\/(?:w|a):t>/g;
  let match;
  while ((match = pattern.exec(xml))) {
    const openEnd = match[0].indexOf(">") + 1;
    const closeStart = match[0].lastIndexOf("</");
    output.push({
      start: match.index,
      end: match.index + match[0].length,
      prefix: match[0].slice(0, openEnd),
      suffix: match[0].slice(closeStart),
      text: decodeXml(match[0].slice(openEnd, closeStart))
    });
  }
  return output;
}

function rebuildXml(xml, nodes) {
  let output = "";
  let cursor = 0;
  for (const node of nodes) {
    output += `${xml.slice(cursor, node.start)}${node.prefix}${encodeXml(node.text)}${node.suffix}`;
    cursor = node.end;
  }
  return `${output}${xml.slice(cursor)}`;
}

function normalizeBlockText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toUpperCase();
}

function humanize(value) {
  return String(value || "").replace(/\[\]$/, "").replaceAll("_", " ");
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function encodeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function findEocd(buffer) {
  const minimum = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_SIGNATURE.EOCD) return offset;
  }
  throw new Error("ZIP_EOCD_NOT_FOUND");
}

const CRC_TABLE = (() => {
  const table = [];
  for (let number = 0; number < 256; number += 1) {
    let value = number;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[number] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
