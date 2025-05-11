from pyzbar.pyzbar import decode
from PIL import Image

img = Image.open("qrcodes/DE01_002.jpg")
decoded = decode(img)

for d in decoded:
    print(d.data.decode("utf-8"))

