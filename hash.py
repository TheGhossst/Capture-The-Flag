import bcrypt

flag = input("Enter a flag to be hashed: ")
hashed_flag = bcrypt.hashpw(flag.encode('utf-8'), bcrypt.gensalt())

print(hashed_flag.decode('utf-8'))