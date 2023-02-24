const express = require("express")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const Users = require("./models").users
const Classes = require("./models").classes
let app = express();
dotenv.config()

app.use(express.json())



const authMiddleWare= (req,res,next)=>{
    const token = req.headers["authorization"]?.split(" ")[1]

    if(!token) return res.status(401).json({message:"Giriş Yapın"});

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , (err,user)=>{
        if(err){
            console.log(err)
            return res.status(500).json(err)
        }
        req.user = user;
        next();
    })

}



app.post("/register",(req,res)=>{
    Users.create(req.body)
})

app.post("/login",(req,res)=>{
    Users.findAll()
    .then(users=>{
        for(let i =0;i<users.length;i++)
        {
            if(users[i].schoolNumber==req.body.schoolNumber && users[i].password== req.body.password)
            {
                const accessToken = jwt.sign({id:users[i].id,schoolNumber:users[i].schoolNumber,password:users[i].password}, process.env.ACCESS_TOKEN_SECRET,{expiresIn:"5m"})
                res.send(accessToken)
                break;
            }
        }
    })
})

app.post("/class",authMiddleWare,(req,res)=>{
    if(req.body.perm=="teacher")
    {
        Classes.findAll()
        .then(result=>res.send(result))
    }
    else if(req.body.perm=="student"){
        var studentClass=[]
        Classes.findAll()
        .then((siniflar)=>{
            for(let i =0;i<siniflar.length;i++)
            {
                if(req.body.class==siniflar[i].class)
                {
                    studentClass.push(siniflar[i])
                }
                
            }
            res.send(studentClass)
        })
    }
})

app.post("/newclass",authMiddleWare,(req,res)=>{
    if(req.body.perm == "teacher")
    {
        Classes.create(req.body)
        res.send({message:"Yeni ders Oluşturuldu!"})
    }
    else
    {
        res.send({message:"Sadece Öğretmenler Ders Açabilir!"})
    }
})

app.post("/enterclass",authMiddleWare,(req,res)=>{
    let userID= req.body.userID;
    let classID = req.body.classID;
    Users.findAll()
    .then(user=>{
        for(let i=0;i<user.length;i++)
        {
            if(user[i].id==userID)
            {
                Classes.findAll()
                .then(allClass=>{
                    for(let i =0;i<allClass.length;i++)
                    {
                        if(allClass[i].id==classID)
                        {
                            let oldClass=JSON.parse(allClass[i].whoEntered)
                            oldClass.push(user[i].fullName)
                            Classes.update(
                                {
                                  whoEntered: JSON.stringify(oldClass) ,
                                },
                                {
                                  where: {id:classID},
                                }
                            ).then(res.send("BAŞARILI"))
                        }
                    }
                })
            }
        }
    })
})

app.listen(8080)