/** Characters outside the UTF8 range, if matched the file is likely binary */
const NON_UTF8_PATTERN = /[^\u0000-\u007F]/;

/** Estimate if the buffer content is text-based */
export function bufferIsUtf8(buffer: Buffer) {
  return NON_UTF8_PATTERN.test(buffer.toString());
}
