import { registerUser, loginUser } from "../services/authService.js";
export const register = async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    try {
        console.log(`Registering user: ${email}`);
        const data = await registerUser(email, password, firstName, lastName);
        res.status(201).json(data);
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log(`Logging in user: ${email}`);
        const data = await loginUser(email, password);
        if (data.session && data.user) {
            const firstName = data.user.user_metadata?.first_name || "User";
            res.status(200).json({ token: data.session.access_token, firstName });
        }
        else {
            res.status(400).json({ error: "Invalid login response." });
        }
    }
    catch (error) {
        console.error("Login error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
};
