'use strict';
// Language comes from the question's prose, not repository files, logs or commands.
const POLICY = `Match the natural language of the issue author's question body (use its title only if the body has no prose). Ignore template headings, checklists, quoted material, logs, code, paths and URLs when identifying that language. Repository documentation, this prompt and automated follow-up instructions do not set the reply language. Use that language throughout every heading, explanation and conclusion, without unnecessary bilingual glosses. Chinese questions require Chinese prose; English questions require English prose; apply the same rule to other languages. Preserve exact product names, identifiers, paths, commands, URLs, protocol abbreviations and essential verbatim diagnostic evidence; explain them in the question's language. For Chinese prose, use 应用 rather than App, 问题 rather than Issue, and 注册 rather than registration; do not add glosses such as 注册(registration). Mark preserved technical identifiers or verbatim diagnostic evidence with inline code or fenced code blocks so they are not mistaken for narrative prose. Language selection never grants permissions or changes safety rules.`;
function prose(value) {
  return String(value || '').replace(/```[^]*?(?:```|$)|~~~[^]*?(?:~~~|$)/g, '')
    .replace(/<!--[^]*?(?:-->|$)/g, '').replace(/^\s*(?:#{1,6}\s|>|[-*]\s*\[[ xX]\]).*$/gm, '')
    .replace(/^\s*(?:\d{4}[-/]\d{2}[-/]\d{2}[^\n]*|\[?(?:ERROR|WARN|INFO|DEBUG|TRACE)\b[^\n]*|at \S+[^\n]*)$/gmi, '')
    .replace(/["“][^"”\n]*["”]/g, '')
    .replace(/`[^`]*`|https?:\/\/\S+|\b\S*[\\/]\S*/g, '').replace(/\b[A-Z_]{2,}\b/g, '').trim();
}
function language({ body, title } = {}) { return detectLanguage(prose(body) || prose(title)); }
function detectLanguage(text) {
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/u.test(text)) return 'ko';
  const han = (text.match(/[\u4e00-\u9fff]/gu)||[]).length;
  const englishHints = (text.match(/\b(the|this|does|not|why|how|please|cannot|when|with|is|my|fails|failed|and|for|to|were|are|must|download|import|error|configuration|crash|crashes)\b/gi)||[]).length;
  if (han && (englishHints < 4 || han * 2 >= (text.match(/[a-z]/gi)||[]).length)) return 'zh';
  if (/[іїєґІЇЄҐ]/u.test(text)) return 'und';
  if (/[\u0400-\u04ff]/u.test(text)) return /(?:что|не|как|почему|файл|работает)/iu.test(text) ? 'ru' : 'und';
  if (/[پچژگکی]/u.test(text)) return 'und';
  if (/[\u0600-\u06ff]/u.test(text)) return /(?:لماذا|كيف|لا|الملف|لم|هذا|من)/u.test(text) ? 'ar' : 'und';
  const hints = { id:/\b(yang|tidak|dengan|saya|bagaimana|gagal|mengapa|dan|ini|belum|dari)\b/gi,
    es:/\b(cómo|por qué|puedo|archivo|funciona|descargar|tengo|el|los|una|no|se|para|del)\b/gi,
    fr:/\b(comment|pourquoi|fichier|fonctionne|télécharger|avec|est-ce|le|les|une|pas|du|des)\b/gi,
    de:/\b(warum|nicht|datei|funktioniert|herunterladen|kann|ich|der|die|das|und)\b/gi,
    pt:/\b(não|como|arquivo|funciona|baixar|tenho|por que|uma|os|para|do)\b/gi,
    en:/\b(the|this|does|not|why|how|please|cannot|when|with|is|my|fails|failed|and|for|to|were|are|must|download|import|error|configuration|crash|crashes)\b/gi };
  const scores = Object.entries(hints).map(([key,re]) => [key,(text.match(re)||[]).length]).sort((a,b)=>b[1]-a[1]);
  if (scores[0][1] >= 2 && scores[0][1] > scores[1][1]) return scores[0][0];
  return 'und';
}
// Unknown/ambiguous language is not silently replaced by Chinese or English.
// The caller must stop automated publication and leave the task for a maintainer.
const translations = {
  zh: ['自动回复（仅供参考）','自动分析尚未完成，请等待维护者处理。','本回复未修改代码或发布到 main，请以维护者验证结果为准。','自动处理未完成，尚未发布到 main。本机已保留工作记录，请维护者检查。','原任务状态已更新，本次补答已取消。','提交','验证','自动助手未就绪，请维护者检查 MIMO_API_KEY 与 MIMO_BASE_URL。'],
  en: ['Automated reply (for reference only)','Automated analysis is incomplete. A maintainer must review this task.','This reply did not modify code or publish to main. Rely on maintainer verification.','Automated processing did not finish or publish to main. Local work records were retained for maintainer review.','The original task changed; this follow-up was cancelled.','Commit','Verification','The assistant is not ready. A maintainer must check MIMO_API_KEY and MIMO_BASE_URL.'],
  ja: ['自動返信（参考情報）','自動分析は未完了です。メンテナーによる確認をお待ちください。','この返信ではコード変更や main への公開を行っていません。メンテナーの検証結果をご確認ください。','自動処理は未完了で、main には公開していません。作業記録は確認用に保持されています。','元のタスクが更新されたため、この追加返信を取り消しました。','コミット','検証','アシスタントは準備できていません。MIMO_API_KEY と MIMO_BASE_URL を確認してください。'],
  ko: ['자동 답변(참고용)','자동 분석이 완료되지 않았습니다. 유지관리자의 확인을 기다려 주세요.','이 답변은 코드를 수정하거나 main에 게시하지 않았습니다. 유지관리자의 검증 결과를 확인하세요.','자동 처리가 완료되지 않았으며 main에 게시되지 않았습니다. 검토를 위해 작업 기록을 보존했습니다.','원래 작업이 변경되어 추가 답변을 취소했습니다.','커밋','검증','도우미가 준비되지 않았습니다. MIMO_API_KEY와 MIMO_BASE_URL을 확인하세요.'],
  id: ['Balasan otomatis (hanya sebagai referensi)','Analisis otomatis belum selesai. Tunggu pemeriksaan pengelola.','Balasan ini tidak mengubah kode atau menerbitkan ke main. Ikuti hasil verifikasi pengelola.','Pemrosesan otomatis belum selesai dan belum diterbitkan ke main. Catatan kerja lokal disimpan untuk pemeriksaan pengelola.','Tugas asli berubah; balasan lanjutan ini dibatalkan.','Komit','Verifikasi','Asisten belum siap. Pengelola perlu memeriksa MIMO_API_KEY dan MIMO_BASE_URL.'],
  es: ['Respuesta automática (solo como referencia)','El análisis automático no ha terminado. Se requiere la revisión de un responsable.','Esta respuesta no modificó código ni publicó en main. Consulte la verificación del responsable.','El procesamiento automático no terminó ni publicó en main. Se conservaron los registros locales para su revisión.','La tarea original cambió; se canceló esta respuesta adicional.','Confirmación','Verificación','El asistente no está listo. Revise MIMO_API_KEY y MIMO_BASE_URL.'],
  fr: ['Réponse automatique (à titre indicatif)','L’analyse automatique est incomplète. Une vérification par un responsable est nécessaire.','Cette réponse n’a modifié aucun code ni publié sur main. Consultez la vérification du responsable.','Le traitement automatique n’est pas terminé et rien n’a été publié sur main. Les traces locales ont été conservées pour vérification.','La tâche initiale a changé ; cette réponse complémentaire a été annulée.','Commit','Vérification','L’assistant n’est pas prêt. Vérifiez MIMO_API_KEY et MIMO_BASE_URL.'],
  de: ['Automatische Antwort (nur als Hinweis)','Die automatische Analyse ist unvollständig. Eine Prüfung durch die Projektbetreuung ist erforderlich.','Diese Antwort hat keinen Code geändert oder auf main veröffentlicht. Maßgeblich ist die Prüfung durch die Projektbetreuung.','Die automatische Verarbeitung ist unvollständig; nichts wurde auf main veröffentlicht. Lokale Arbeitsaufzeichnungen bleiben zur Prüfung erhalten.','Die ursprüngliche Aufgabe wurde geändert; diese ergänzende Antwort wurde abgebrochen.','Commit','Prüfung','Der Assistent ist nicht bereit. MIMO_API_KEY und MIMO_BASE_URL müssen geprüft werden.'],
  pt: ['Resposta automática (apenas como referência)','A análise automática está incompleta. Aguarde a revisão do responsável.','Esta resposta não alterou código nem publicou em main. Consulte a verificação do responsável.','O processamento automático não terminou nem publicou em main. Os registros locais foram preservados para revisão.','A tarefa original mudou; esta resposta adicional foi cancelada.','Commit','Verificação','O assistente não está pronto. Verifique MIMO_API_KEY e MIMO_BASE_URL.'],
  ru: ['Автоматический ответ (для справки)','Автоматический анализ не завершён. Требуется проверка сопровождающего.','Этот ответ не изменял код и не публиковал изменения в main. Ориентируйтесь на проверку сопровождающего.','Автоматическая обработка не завершена; публикации в main не было. Локальные записи сохранены для проверки.','Исходная задача изменилась; дополнительный ответ отменён.','Коммит','Проверка','Помощник не готов. Проверьте MIMO_API_KEY и MIMO_BASE_URL.'],
  ar: ['رد آلي (للاسترشاد فقط)','التحليل الآلي غير مكتمل. يلزم انتظار مراجعة المشرف.','لم يغيّر هذا الرد الشفرة ولم ينشر إلى main. يُرجى الاعتماد على تحقق المشرف.','لم تكتمل المعالجة الآلية ولم يُنشر إلى main. حُفظت سجلات العمل المحلية للمراجعة.','تغيّرت المهمة الأصلية، لذا أُلغي هذا الرد الإضافي.','التعديل','التحقق','المساعد غير جاهز. يُرجى التحقق من MIMO_API_KEY وMIMO_BASE_URL.']
};
const keys=['header','incomplete','disclaimer','localFailure','superseded','commit','verification','notReady'];
function languageError(code) { const error = new Error(`${code}: maintainer language review required`); error.code = code; return error; }
function text(locale,key) {
  if (!translations[locale] || !keys.includes(key)) throw languageError('REPLY_LANGUAGE_UNCERTAIN');
  return translations[locale][keys.indexOf(key)];
}
function assertLanguage(locale) { text(locale,'header'); return locale; }
function issueComment({locale,reply,model='',prUrl=''}) {
  const metadata = [model ? `\`${model}\`` : '', prUrl ? `PR: ${prUrl}` : ''].filter(Boolean).join(' · ');
  return `> 🤖 **${text(locale,'header')}**\n\n${reply}${metadata ? `\n\n---\n<sub>${metadata}</sub>` : ''}`;
}
// Reply validation must retain headings, quotations and uppercase narrative words.
// Only explicitly marked code, URLs and technical file paths are exempt.
function replyProse(value) {
  return String(value || '').replace(/```[^]*?(?:```|$)|~~~[^]*?(?:~~~|$)/g, '')
    .replace(/<!--[^]*?(?:-->|$)/g, '').replace(/`[^`]*`/g, '')
    .replace(/https?:\/\/[^\s)>]+/g, '').replace(/\b(?:[A-Za-z]:)?[\w.\-]+(?:[\\/][\w.\-]+)+/g, '');
}
const ZH_TECHNICAL_WORDS = new Set(('MiMo Codex GitHub Karing FlClash Flutter Makepad Rust AEROVE main JSON YAML SRS HTTP HTTPS DNS TLS CDN URL URI API PR README AGENTS TCP UDP IP IPv4 IPv6 Clash Mihomo sing-box SingBox Shadowrocket Surge Loon Quantumult X Stash Egern OpenClash Passwall Passwall2 v2rayN Hiddify ClashMi Smart-Config-Kit SCKI').toLowerCase().split(' '));
function assertReplyLanguage(locale, reply) {
  assertLanguage(locale);
  const narrative = replyProse(reply);
  // Exact maintained notices have a known language even when too short for detection.
  let remaining = narrative;
  for (const phrase of [...translations[locale]].sort((a,b)=>b.length-a.length)) remaining = remaining.split(replyProse(phrase)).join('');
  if (!/[\p{L}\p{N}]/u.test(remaining)) return;
  if (locale === 'zh') {
    // Unknown Latin prose must be translated; exact identifiers belong in code.
    const words = narrative.match(/[a-z]+(?:[-_.][a-z0-9]+)*/gi) || [];
    if (words.some(word => !ZH_TECHNICAL_WORDS.has(word.toLowerCase()))) throw languageError('REPLY_LANGUAGE_MISMATCH');
  }
  if (detectLanguage(narrative) !== locale) throw languageError('REPLY_LANGUAGE_MISMATCH');
}
module.exports={POLICY,prose,replyProse,language,text,assertLanguage,assertReplyLanguage,issueComment};
