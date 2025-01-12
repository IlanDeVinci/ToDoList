import supabase from "../utils/init.js";
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            console.warn("Authentication failed: Invalid Authorization header format");
            res.status(401).json({ error: "Unauthorized: Invalid token format" });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token || token.length < 10) {
            // Basic token validation
            console.warn("Authentication failed: Invalid token format");
            res.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }
        const { data: { user }, error, } = await supabase.auth.getUser(token);
        if (error || !user?.id) {
            console.error("Authentication error:", error);
            res.status(401).json({ error: "Unauthorized: Invalid token" });
            return;
        }
        const { data: { session }, error: sessionError, } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.error("Session validation failed:", sessionError);
            res.status(401).json({ error: "Unauthorized: Invalid session" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Authentication failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
