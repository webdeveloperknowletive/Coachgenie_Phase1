import bcrypt

# 1. Hashing a password
password = "Lokesh@1234"
# Convert the string password to bytes
password_bytes = password.encode('utf-8')

# Generate a unique, random salt and hash the password
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(password_bytes, salt)
print(f"Hashed: {hashed_password}")

# 2. Verifying a password
user_input = "Lokesh@1234"
user_input_bytes = user_input.encode('utf-8')

# bcrypt.checkpw automatically extracts the original salt from the hash
if bcrypt.checkpw(user_input_bytes, hashed_password):
    print("Password match! User authenticated.")
else:
    print("Incorrect password.")
