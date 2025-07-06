/**
 * نظام إرسال تقارير تليجرام المحسن
 * يتضمن إعادة المحاولة، معالجة الأخطاء، وتحسينات الأمان
 */

class TelegramReportingSystem {
    constructor(botToken, summaryChatId, detailedChatId) {
        this.botToken = botToken;
        this.summaryChatId = summaryChatId;
        this.detailedChatId = detailedChatId;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 ثانية
        this.maxMessageLength = 4096;
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    /**
     * إرسال رسالة إلى تليجرام مع إعادة المحاولة
     */
    async sendMessage(chatId, text, options = {}) {
        const defaultOptions = {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            disable_notification: false
        };

        const finalOptions = { ...defaultOptions, ...options };

        // التحقق من صحة المدخلات
        if (!this.botToken || !chatId || !text) {
            console.warn('⚠️ معلومات تليجرام غير مكتملة');
            return { success: false, error: 'معلومات غير مكتملة' };
        }

        // تنظيف النص من الرموز الخاصة
        const cleanText = this.sanitizeText(text);

        try {
            if (cleanText.length <= this.maxMessageLength) {
                return await this.sendSingleMessage(chatId, cleanText, finalOptions);
            } else {
                return await this.sendLongMessage(chatId, cleanText, finalOptions);
            }
        } catch (error) {
            console.error('❌ خطأ في إرسال الرسالة:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إرسال رسالة واحدة
     */
    async sendSingleMessage(chatId, text, options, retryCount = 0) {
        const url = `${this.apiUrl}/sendMessage`;
        const payload = {
            chat_id: chatId,
            text: text,
            ...options
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.ok) {
                console.log(`✅ تم إرسال الرسالة بنجاح إلى ${chatId}`);
                return { success: true, data: result };
            } else {
                throw new Error(`API Error: ${result.description || 'خطأ غير معروف'}`);
            }
        } catch (error) {
            console.error(`❌ فشل إرسال الرسالة (المحاولة ${retryCount + 1}):`, error.message);

            if (retryCount < this.maxRetries) {
                console.log(`🔄 إعادة المحاولة بعد ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return this.sendSingleMessage(chatId, text, options, retryCount + 1);
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * إرسال رسالة طويلة مقسمة إلى أجزاء
     */
    async sendLongMessage(chatId, text, options) {
        const parts = this.splitMessage(text);
        const results = [];

        for (let i = 0; i < parts.length; i++) {
            const partText = parts.length > 1 
                ? `*الجزء ${i + 1}/${parts.length}:*\n\n${parts[i]}`
                : parts[i];

            const result = await this.sendSingleMessage(chatId, partText, options);
            results.push(result);

            if (!result.success) {
                console.error(`❌ فشل إرسال الجزء ${i + 1}/${parts.length}`);
                break;
            }

            // تأخير بين الرسائل لتجنب حدود API
            if (i < parts.length - 1) {
                await this.delay(1000);
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`📊 تم إرسال ${successCount}/${parts.length} أجزاء بنجاح`);

        return {
            success: successCount === parts.length,
            results: results,
            totalParts: parts.length,
            successfulParts: successCount
        };
    }

    /**
     * تقسيم الرسالة الطويلة إلى أجزاء
     */
    splitMessage(text) {
        if (text.length <= this.maxMessageLength) {
            return [text];
        }

        const parts = [];
        let currentPart = '';
        const lines = text.split('\n');

        for (const line of lines) {
            const testPart = currentPart + (currentPart ? '\n' : '') + line;
            
            if (testPart.length <= this.maxMessageLength) {
                currentPart = testPart;
            } else {
                if (currentPart) {
                    parts.push(currentPart);
                    currentPart = line;
                } else {
                    // السطر طويل جداً، قسمه
                    const chunks = this.splitLongLine(line);
                    parts.push(...chunks.slice(0, -1));
                    currentPart = chunks[chunks.length - 1];
                }
            }
        }

        if (currentPart) {
            parts.push(currentPart);
        }

        return parts;
    }

    /**
     * تقسيم سطر طويل
     */
    splitLongLine(line) {
        const chunks = [];
        for (let i = 0; i < line.length; i += this.maxMessageLength) {
            chunks.push(line.substring(i, i + this.maxMessageLength));
        }
        return chunks;
    }

    /**
     * تنظيف النص من الرموز الخاصة
     */
    sanitizeText(text) {
        // إزالة الرموز الرياضية المعقدة للتليجرام
        let cleanText = text
            .replace(/\$[^$]*\$/g, '[معادلة رياضية]')
            .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '[رمز رياضي]')
            .replace(/\\\([^)]*\\\)/g, '[معادلة رياضية]')
            .replace(/\\\[[^\]]*\\\]/g, '[معادلة رياضية]');

        // تنظيف الرموز الخاصة في Markdown
        cleanText = cleanText
            .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');

        return cleanText.trim();
    }

    /**
     * إنشاء التقرير الموجز
     */
    createSummaryReport(data) {
        const currentTime = new Date().toLocaleString('ar-SA', {
            timeZone: 'Asia/Riyadh',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const timeMinutes = Math.floor(data.timeTaken / 60);
        const timeSeconds = data.timeTaken % 60;
        const timeString = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;

        return `
*📊 تقرير موجز لاختبار ${data.subjectName || 'الرياضيات والعلوم'}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*👤 المستخدم:* \`${data.username}\`
*📚 الدرس:* ${data.lesson}
*🎯 النتيجة:* ${data.correct} / ${data.totalQuestions} (*${data.percentage}%*)
*⏱️ الوقت المستغرق:* ${timeString}
*🏅 التقدير:* ${data.grade}
*📅 التاريخ:* ${currentTime}
        `.trim();
    }

    /**
     * إنشاء التقرير المفصل
     */
    createDetailedReport(data) {
        const currentTime = new Date().toLocaleString('ar-SA', {
            timeZone: 'Asia/Riyadh',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const timeMinutes = Math.floor(data.timeTaken / 60);
        const timeSeconds = data.timeTaken % 60;
        const timeString = `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}`;

        let report = `
*🔍 تقرير مفصل لاختبار ${data.subjectName || 'الرياضيات والعلوم'}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*📚 عنوان الدرس:* ${data.lesson}
*📅 تاريخ الاختبار:* ${currentTime}

*📊 ملخص الأداء:*
*▫️ عدد الأسئلة:* ${data.totalQuestions}
*✅ الإجابات الصحيحة:* ${data.correct}
*❌ الإجابات الخاطئة:* ${data.incorrect}
*🤷‍♂️ بدون إجابة:* ${data.unanswered}
*🎯 النتيجة النهائية:* ${data.correct} من ${data.totalQuestions}
*📈 النسبة المئوية:* *${data.percentage}%*
*⏱️ الوقت المستغرق:* ${timeString}
*🏅 التقدير:* ${data.grade}
`;

        if (data.incorrect > 0 && data.incorrectAnswersDetails) {
            report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*⚠️ تحليل الأخطاء:*
`;
            data.incorrectAnswersDetails.forEach((item, index) => {
                const cleanQuestion = this.sanitizeText(item.question);
                const cleanUserAnswer = this.sanitizeText(item.userAnswer);
                const cleanCorrectAnswer = this.sanitizeText(item.correctAnswer);

                report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*(${index + 1}) السؤال:* ${cleanQuestion}
*🔴 إجابته الخاطئة:* \`${cleanUserAnswer}\`
*🟢 الإجابة الصحيحة:* \`${cleanCorrectAnswer}\`
`;
            });
        } else {
            report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*🎉 لم يتم تسجيل أي أخطاء. عمل رائع!*
`;
        }

        return report.trim();
    }

    /**
     * إرسال التقارير الكاملة
     */
    async sendReports(data) {
        const results = {
            summary: { success: false },
            detailed: { success: false }
        };

        try {
            // إرسال التقرير الموجز
            console.log('📤 إرسال التقرير الموجز...');
            const summaryReport = this.createSummaryReport(data);
            results.summary = await this.sendMessage(this.summaryChatId, summaryReport);

            // تأخير قصير بين التقارير
            await this.delay(2000);

            // إرسال التقرير المفصل
            console.log('📤 إرسال التقرير المفصل...');
            const detailedReport = this.createDetailedReport(data);
            results.detailed = await this.sendMessage(this.detailedChatId, detailedReport);

            // تسجيل النتائج
            if (results.summary.success) {
                console.log('✅ تم إرسال التقرير الموجز بنجاح');
            } else {
                console.error('❌ فشل إرسال التقرير الموجز');
            }

            if (results.detailed.success) {
                console.log('✅ تم إرسال التقرير المفصل بنجاح');
            } else {
                console.error('❌ فشل إرسال التقرير المفصل');
            }

        } catch (error) {
            console.error('❌ خطأ في إرسال التقارير:', error);
        }

        return results;
    }

    /**
     * اختبار الاتصال
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/getMe`);
            const result = await response.json();

            if (response.ok && result.ok) {
                console.log('✅ اختبار الاتصال ناجح');
                console.log(`   اسم البوت: ${result.result.first_name}`);
                console.log(`   معرف البوت: @${result.result.username}`);
                return { success: true, botInfo: result.result };
            } else {
                throw new Error(result.description || 'فشل في الاتصال');
            }
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * تأخير
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * إرسال إشعار حالة النظام
     */
    async sendSystemStatus(status, message) {
        const statusEmoji = {
            'online': '🟢',
            'offline': '🔴',
            'warning': '🟡',
            'error': '❌',
            'info': 'ℹ️'
        };

        const statusText = `
${statusEmoji[status] || 'ℹ️'} *حالة النظام*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*الحالة:* ${status}
*الرسالة:* ${message}
*الوقت:* ${new Date().toLocaleString('ar-SA')}
        `.trim();

        return await this.sendMessage(this.detailedChatId, statusText);
    }
}

// تصدير النظام للاستخدام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramReportingSystem;
}

// إضافة النظام إلى النافذة للاستخدام في المتصفح
if (typeof window !== 'undefined') {
    window.TelegramReportingSystem = TelegramReportingSystem;
}

