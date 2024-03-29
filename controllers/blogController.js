const mongoose = require('mongoose')
const blogModel = require('../models/blogModel')
const userModel = require('../models/userModel')
const db = require('../config/db')

//GET ALL BLOGS
exports.getAllBlogsController = async(req,res) => {
    try {
        const blogs = await blogModel.find({}).populate("user");
        if(!blogs){
            return res.status(200).send({ 
                success:false,
                message:'No blogs found'
            })
        }
        return res.status(200).send({
            success: true,
            BlogCount: blogs.length,
            message: "All Blogs Lists",
            blogs,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success:false,
            message:'Error while getting blogs',
            error,
        })
    }
}

//Create blog
exports.createBlogController = async (req, res) => {
    try {
        const { title, description, image, user } = req.body;
        //validation
        if (!title || !description || !image || !user) {
            return res.status(400).send({
                success: false,
                message: "Please Provide ALl Fields",
            });
        }
        const exisitingUser = await userModel.findById(user);
        //validaton
        if (!exisitingUser) {
            return res.status(404).send({
                success: false,
                message: "unable to find user",
            });
        }

        const newBlog = new blogModel({ title, description, image, user });
        const session = await mongoose.startSession();
        session.startTransaction();
        await newBlog.save({ session });
        exisitingUser.blogs.push(newBlog);
        await exisitingUser.save({session});
        await session.commitTransaction();
        await newBlog.save();
        return res.status(201).send({
            success: true,
            message: "Blog Created!",
            newBlog,
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Error While Creating blog",
            error,
        });
    }
};
//Update Blog
exports.updateBlogController = async(req,res) => {
    try {
        const {id} = req.params
        const {title,description,image} = req.body;
        const blog = await blogModel.findByIdAndUpdate(
            id,
            {...req.body}, 
            {new:true}
            );
        return res.status(200).send({
            success: true,
            message: "Blog updated!",
            blog,
        })
    } catch (error) {
        console.log(error)
        return res.status(400).send({
            success:false,
            message:'Error while updating blog',
            error
        })
    }
}

//Single Blog
exports.getBlogByIdController = async(req,res) => {
    try {
        const {id} = req.params;
        const blog = await blogModel.findById(id)
        if(!blog){
            return res.status(404).send({
                success:false,
                message:'blog not found with this is'
            });
        }
        return res.status(200).send({
            success:true,
            message:'fetch single blog',
            blog,
        })
    } catch (error) {
        console.log(error)
        return res.status(400).send({
           success:false,
           message:"error while getting single blog",
           error, 
        });
    }
}

//Delete blog
exports.deleteBlogController = async(req,res) => {
    try {
        const blog = await blogModel
        .findByIdAndDelete(req.params.id).populate("user")
        await blog.user.blogs.pull(blog) 
        await blog.user.save(); 
        return res.status(200).send({
            success:true,
            message:'Blog Deleted!',
        })
    } catch (error) {
        console.log(error)
        return res.status(400).send({
            success:false,
            message:'Error while deleting blog',
            error
        })
    }
}

//GET USER BLOG
exports.userBlogController = async(req,res) => {
    try {
        const userBlog = await userModel.findById(req.params.id).populate("blogs");
        if(!userBlog){
            return res.status(404).send({
                success:false,
                message:'blogs not found with this id',
            });
        }
        return res.status(200).send({
            success:true,
            message:"user blogs",
            userBlog,
        });
    } catch (error) {
        console.log(error)
        return res.status(400).send({
            success:false,
            message:'error in user blog',
            error,
        })
    }
};

// COMMENT BLOG
exports.commentBlogController = async (req, res) => {
    try {
        const userId = req.params.id;
        const { title, description } = req.body;

        // Check if the user exists
        const exisitingUser = await userModel.findById(userId);
        if (!exisitingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const blogId = req.params.blogId;

        const existingBlog = await blogModel.findById(blogId);
        if (!existingBlog) {
            const blog = await blogModel.create({
                title,
                description,
                user: userId,
                comments: [{user: userId, content: 'Content'}]
            });
            res.status(201).json({
                success: true,
                message: 'Comment Blog added successfully',
                blog
            });
        }
        
        existingBlog.comments.push({user: userId, content: 'Content'});

        existingBlog.save();

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            blog: existingBlog
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
