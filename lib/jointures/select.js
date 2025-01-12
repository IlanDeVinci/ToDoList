import supabase from "../utils/init.js";
import user from "./../login.js";
const getJoinedData = async () => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const { data, error } = await supabase
        .from("user")
        .select("*, comments!inner(*)");
    if (error) {
        console.error(error);
        return false;
    }
    return data;
};
const getComments = async () => {
    const data = await getJoinedData();
    if (!data) {
        return false;
    }
    data.map((user) => {
        console.log(`${user.id} : ${user.email}`, user.comments);
    });
    return true;
};
const comments = getComments();
