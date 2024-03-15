from translate import Translator
import sys

#Langs: en, hi, mr, gu, ta, te, bn
fromLang, toLang, inp = sys.argv[1], sys.argv[2], sys.argv[3]

translator= Translator(from_lang= fromLang, to_lang= toLang)
translation = translator.translate(inp)
print(translation)