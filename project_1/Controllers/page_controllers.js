const home=(req,res)=>{
    res.send("Homepage");
};

const about=(req,res)=>{
    res.send("About");
};

const careers=(req,res)=>{
    res.send("Careers");
};

const help=(req,res)=>{
    res.send("Help")
};
module.exports={
    home,
    about,
    help,
    careers
}