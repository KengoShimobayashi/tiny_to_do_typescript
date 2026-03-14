const PasswordLength = 10

const PasswordChars = "23456789abcdefghijkmnpqrstuvwxyz"

export const generatePassword = () => {
    return Array.from({ length: PasswordLength }, () => {
        const randomIndex = Math.floor(Math.random() * PasswordChars.length);
        return PasswordChars[randomIndex];
    }).join("");
}