const senderrordev=(res,err)=>{
    return res.status(err.status).json({
        status:err.status,
        message:err.message,
        data,
        stack:err.stack,
    })
};

const senderrorprod=(res,err)=>{
    if(err.isOperational){
        return res.status(err.statusCode || 500).json({
        err:err.message,
        status:err.status,
    })
  } 
  console.log("Bug")
  res.status(500).json({
    message:err.message,
    status:err.status
  })
};

const errorcontroller=(err,req,res,next)=>{
    const statusCode=err.statusCode || 500;
    const status=err.status || 'error';

    if (process.env.NODE_ENV=='Development'){
        senderrordev(res,err)
    }else{
        senderrorprod(res,err)
    }
}

module.exports = errorcontroller;