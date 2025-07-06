#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار نظام إرسال تقارير تليجرام
"""

import requests
import json
import time
from datetime import datetime

# إعدادات تليجرام
TELEGRAM_BOT_TOKEN = '8138541482:AAEMwUnhx_pHI1PxZn6oVS-naNp4jiL08TQ'
SUMMARY_CHAT_ID = '@quranmytest'
DETAILED_CHAT_ID = '-1001722914216'

def send_telegram_message(chat_id, text, parse_mode='Markdown', retries=3):
    """
    إرسال رسالة إلى تليجرام مع إعادة المحاولة في حالة الفشل
    """
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        print("❌ إعدادات تليجرام غير مكتملة")
        return False
    
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    MAX_LENGTH = 4096
    
    try:
        if len(text) <= MAX_LENGTH:
            # إرسال رسالة واحدة
            response = requests.post(url, {
                'chat_id': chat_id,
                'text': text,
                'parse_mode': parse_mode,
                'disable_web_page_preview': True
            }, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ تم إرسال الرسالة بنجاح إلى {chat_id}")
                return True
            else:
                print(f"❌ فشل إرسال الرسالة: {response.status_code} - {response.text}")
                return False
        else:
            # تقسيم الرسالة إلى أجزاء
            parts = [text[i:i+MAX_LENGTH] for i in range(0, len(text), MAX_LENGTH)]
            for i, part in enumerate(parts):
                response = requests.post(url, {
                    'chat_id': chat_id,
                    'text': f"الجزء {i+1}/{len(parts)}:\n\n{part}",
                    'parse_mode': parse_mode,
                    'disable_web_page_preview': True
                }, timeout=10)
                
                if response.status_code != 200:
                    print(f"❌ فشل إرسال الجزء {i+1}: {response.status_code} - {response.text}")
                    return False
                
                time.sleep(1)  # تأخير بين الرسائل
            
            print(f"✅ تم إرسال جميع الأجزاء ({len(parts)}) بنجاح إلى {chat_id}")
            return True
            
    except requests.exceptions.RequestException as e:
        print(f"❌ خطأ في الشبكة: {e}")
        if retries > 0:
            print(f"🔄 إعادة المحاولة... ({retries} محاولات متبقية)")
            time.sleep(2)
            return send_telegram_message(chat_id, text, parse_mode, retries - 1)
        return False
    except Exception as e:
        print(f"❌ خطأ غير متوقع: {e}")
        return False

def test_telegram_connection():
    """
    اختبار الاتصال بـ API تليجرام
    """
    print("🔍 اختبار الاتصال بـ API تليجرام...")
    
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe'
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            bot_info = response.json()
            if bot_info.get('ok'):
                bot_data = bot_info.get('result', {})
                print(f"✅ الاتصال ناجح!")
                print(f"   اسم البوت: {bot_data.get('first_name', 'غير محدد')}")
                print(f"   معرف البوت: @{bot_data.get('username', 'غير محدد')}")
                print(f"   ID البوت: {bot_data.get('id', 'غير محدد')}")
                return True
            else:
                print(f"❌ فشل في الحصول على معلومات البوت: {bot_info}")
                return False
        else:
            print(f"❌ فشل الاتصال: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ خطأ في الاتصال: {e}")
        return False

def create_test_reports():
    """
    إنشاء تقارير اختبارية
    """
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # التقرير الموجز
    summary_report = f"""
*📊 تقرير موجز لاختبار الرياضيات والعلوم*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*👤 المستخدم:* `طالب تجريبي`
*📚 الدرس:* الجبر والهندسة
*🎯 النتيجة:* 8 / 10 (*80%*)
*⏱️ الوقت المستغرق:* 5:30
*🏅 التقدير:* 👍 جيد جداً! استمر في التقدم.
*📅 التاريخ:* {current_time}

*🔧 هذا تقرير اختبار للنظام*
    """.strip()
    
    # التقرير المفصل
    detailed_report = f"""
*🔍 تقرير مفصل لاختبار الرياضيات والعلوم*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*📚 عنوان الدرس:* الجبر والهندسة
*📅 تاريخ الاختبار:* {current_time}

*📊 ملخص الأداء:*
*▫️ عدد الأسئلة:* 10
*✅ الإجابات الصحيحة:* 8
*❌ الإجابات الخاطئة:* 2
*🤷‍♂️ بدون إجابة:* 0
*🎯 النتيجة النهائية:* 8 من 10
*📈 النسبة المئوية:* *80%*
*⏱️ الوقت المستغرق:* 5:30
*🏅 التقدير:* 👍 جيد جداً! استمر في التقدم.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*⚠️ تحليل الأخطاء:*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*(1) السؤال:* ما هو ناتج المعادلة x² + 5x + 6 = 0؟
*🔴 إجابته الخاطئة:* `x = -2, x = -4`
*🟢 الإجابة الصحيحة:* `x = -2, x = -3`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*(2) السؤال:* ما هي مساحة المثلث الذي أضلاعه 3، 4، 5؟
*🔴 إجابته الخاطئة:* `8 وحدة مربعة`
*🟢 الإجابة الصحيحة:* `6 وحدة مربعة`

*🔧 هذا تقرير اختبار للنظام*
    """.strip()
    
    return summary_report, detailed_report

def test_chat_access():
    """
    اختبار الوصول إلى القنوات/المجموعات
    """
    print("\n🔍 اختبار الوصول إلى القنوات...")
    
    # اختبار القناة الموجزة
    print(f"📋 اختبار القناة الموجزة: {SUMMARY_CHAT_ID}")
    test_message = f"🧪 رسالة اختبار من النظام - {datetime.now().strftime('%H:%M:%S')}"
    
    if send_telegram_message(SUMMARY_CHAT_ID, test_message):
        print("✅ نجح الوصول إلى القناة الموجزة")
    else:
        print("❌ فشل الوصول إلى القناة الموجزة")
    
    time.sleep(2)
    
    # اختبار القناة المفصلة
    print(f"📋 اختبار القناة المفصلة: {DETAILED_CHAT_ID}")
    
    if send_telegram_message(DETAILED_CHAT_ID, test_message):
        print("✅ نجح الوصول إلى القناة المفصلة")
    else:
        print("❌ فشل الوصول إلى القناة المفصلة")

def main():
    """
    الدالة الرئيسية لاختبار النظام
    """
    print("🚀 بدء اختبار نظام إرسال تقارير تليجرام")
    print("=" * 50)
    
    # اختبار الاتصال
    if not test_telegram_connection():
        print("❌ فشل اختبار الاتصال. توقف الاختبار.")
        return
    
    # اختبار الوصول إلى القنوات
    test_chat_access()
    
    # اختبار إرسال التقارير
    print("\n📊 اختبار إرسال التقارير...")
    summary_report, detailed_report = create_test_reports()
    
    print("📤 إرسال التقرير الموجز...")
    if send_telegram_message(SUMMARY_CHAT_ID, summary_report):
        print("✅ تم إرسال التقرير الموجز بنجاح")
    else:
        print("❌ فشل إرسال التقرير الموجز")
    
    time.sleep(3)
    
    print("📤 إرسال التقرير المفصل...")
    if send_telegram_message(DETAILED_CHAT_ID, detailed_report):
        print("✅ تم إرسال التقرير المفصل بنجاح")
    else:
        print("❌ فشل إرسال التقرير المفصل")
    
    print("\n" + "=" * 50)
    print("🏁 انتهى اختبار النظام")

if __name__ == "__main__":
    main()

