import { getAllUsers,createUser } from "../services/user.service.js";

export const getUser = async (req,res)=>{
    
     try{
        const user = await getAllUsers();

        res.status(200).json(user);
     }
     catch(err){
            res.status(500).json({
                message: err.message,
            });
     }
};

export const addUser = async (req,res)=>{
    try{
        const user = createUser(req.body);

        res.status(200).json(user);
    }
    catch(err)
    {
        res.status(500).json({
            message: err.message,
        });
    }
}