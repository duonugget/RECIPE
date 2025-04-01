file =  open("/home/potator/insert_to_SQl","a")
read = open("/home/potator/Documents/reviews_cleaned.csv","r")
content = read.read().split("\n")
count = 0
for line in content:
    if (line.split(";")[0] == "Review"):
        continue
    if (count == len(content)):
        file.write("(" + line + ");\n")
    else:
        file.write("(" + line + "),\n")