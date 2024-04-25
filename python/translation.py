from mtranslate import translate
import sys

INDIC = ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"]

def translate_to_indic(text, target_language, source_language):
    try:
        translated_text = translate(text, target_language, source_language)
        return translated_text
    except Exception as e:
        return str(e)
    
text_to_translate = sys.argv[3]
fromLang = sys.argv[1]
toLang = sys.argv[2]

translated_text = translate_to_indic(text_to_translate, toLang, fromLang)
sys.stdout.buffer.write(translated_text.encode('utf-8'))