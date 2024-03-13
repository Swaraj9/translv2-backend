#!/usr/bin/env python3

import wave
import sys
import json

from vosk import Model, KaldiRecognizer, SetLogLevel

# You can set log level to -1 to disable debug messages
SetLogLevel(-1)

wf = wave.open(sys.argv[1], "rb")
if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
    print("Audio file must be WAV format mono PCM.")
    sys.exit(1)

# model = Model(lang="en-us")

# You can also init model by name or with a folder path
model = Model(model_name="vosk-model-small-en-us-0.15")
# model = Model("models/en")

rec = KaldiRecognizer(model, wf.getframerate())
rec.SetWords(True)
rec.SetPartialWords(True)

while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        out_data = json.loads(rec.Result())
        print(out_data["text"])
    # else:
    #     print(rec.PartialResult())

fin_data = json.loads(rec.FinalResult())
print(fin_data["text"])