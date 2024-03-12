/** Characters outside the UTF8 range, if matched the file is likely binary */
const NON_UTF8_PATTERN = /[^\u0000-\u007F]/;

export function getNonBinaryContents(buffer: Buffer) {
  const contents = buffer.toString();
  return NON_UTF8_PATTERN.test(contents) ? '[binary file]' : contents;
}
