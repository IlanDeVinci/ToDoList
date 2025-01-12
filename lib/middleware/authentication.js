import supabase from "../utils/init";
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: "No authorization header" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }
    try {
        const { data: { user }, error, } = await supabase.auth.getUser(token);
        if (error || !user) {
            res.status(401).json({ error: "Invalid token" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Authentication failed" });
    }
};
