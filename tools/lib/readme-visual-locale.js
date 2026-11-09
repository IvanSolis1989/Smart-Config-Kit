'use strict';

const HAN = /\p{Script=Han}/u;
// No technical names in the current visual catalog require a Han exception.
// Add any future exception as a reviewed exact label, never as a pattern.
const ENGLISH_HAN_LABELS = Object.freeze([]);
function assertEnglish(value) {
  const text = String(value);
  if (HAN.test(text) && !ENGLISH_HAN_LABELS.includes(text)) {
    throw new Error('Untranslated English visual text: ' + text);
  }
  return text;
}
function createVisualTranslator(catalog, locale = 'en') {
  if (!['en', 'zh-CN'].includes(locale)) throw new Error('Unsupported visual locale');
  const translate = value => {
    const input = String(value);
    if (locale === 'zh-CN') return input;
    let result;
    if (!HAN.test(input)) result = input;
    else if (Object.hasOwn(catalog, input)) result = catalog[input];
    else if (input.endsWith(' 配置入口')) result = translate(input.slice(0, -5)) + ' configurations';
    else if (input.includes('；')) result = input.split('；').map(translate).join('; ');
    else if (input.startsWith('下载 ')) result = 'Download ' + translate(input.slice(3));
    else if (input.startsWith('打开')) result = 'Open ' + translate(input.slice(2).trim());
    else if (input.endsWith(' 原始文件')) result = translate(input.slice(0, -5)) + ' raw file';
    else throw new Error('Missing visual translation: ' + input);
    return assertEnglish(result);
  };
  return translate;
}
module.exports = { createVisualTranslator, assertEnglish };
