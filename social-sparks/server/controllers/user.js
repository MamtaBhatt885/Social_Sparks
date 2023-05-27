import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { sendEmail } from "../middleware/sendEmail.js";
import crypto from "crypto";
import cloudinary from 'cloudinary';

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;
  // const file = req.file;

  if (!name || !email || !password)
    // if (!name || !email || !password || !file)
    return next(new ErrorHandler("Please enter all field", 400));

  let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("User Already Exist", 409));

  // const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(avatar, {
    folder: "avatars",
  });
  // const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  const token = await user.generateToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(201).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password").populate("posts followers following");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User does not exist",
    });
  }
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Incorrect password",
    });
  }
  const token = await user.generateToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(200).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
  res.status(500).json({
    success: false,
  });
});
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

export const followUser = catchAsyncError(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!userToFollow) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (loggedInUser.following.includes(userToFollow._id)) {
    const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
    const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);

    loggedInUser.following.splice(indexfollowing, 1);
    userToFollow.followers.splice(indexfollowers, 1);

    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User Unfollowed",
    });
  } else {
    loggedInUser.following.push(userToFollow._id);
    userToFollow.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User followed",
    });
  }
});

export const updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide old and new password",
    });
  }

  const isMatch = await user.matchPassword(oldPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Incorrect old password",
    });
  }
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Updated",
  });
});

export const updateProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, email, avatar } = req.body;

  if (name) {
    user.name = name;
  }
  if (email) {
    user.email = email;
  }
  if (avatar){
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    })
    user.avatar.public_id = myCloud.public_id;
    user.avatar.url = myCloud.secure_url;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated",
  });
});

export const deleteMyProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);
    const posts = user.posts;
    const followers = user.followers;
    const following = user.following;
    const userId = user._id;  

    // delete avatar from cloudinary

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.remove();
  //Logout user after deleting profile
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  //Deleting yourself as other's follower in other person's account or removing user from followers following
  for (let i = 0; i < followers.length; i++) {
    const follower = await User.findById(followers[i]);
    const index = follower.following.indexOf(userId);
    follower.following.splice(index, 1);
    await follower.save();
  }
  //Removing user from following's follower
  for (let i = 0; i < following.length; i++) {
    const follows = await User.findById(following[i]);
    const index = follows.followers.indexOf(userId);
    follows.followers.splice(index, 1);
    await follows.save();
  }
//Delete all posts of the user
for (let i = 0; i < posts.length; i++) {
  const post = await Post.findById(posts[i]);
  await cloudinary.v2.uploader.destroy(post.image.public_id);

  await post.remove();
}
  
  // Deleting comments of deleted user

  const allPosts = await Post.find();

  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.comments.length; j++) {
      if (post.comments[j].user === userId) {
        post.comments.splice(j, 1);
      }
    }
    await post.save();
  }

  

   // removing all likes of the user from all posts

   for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.likes.length; j++) {
      if (post.likes[j] === userId) {
        post.likes.splice(j, 1);
      }
    }
    await post.save();
  }

  res.status(200).json({
    success: true,
    message: "Profile Deleted",
  });
});

export const myProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id).populate("posts followers following");

  res.status(200).json({
    success: true,
    user,
  });
});

export const getUserProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.params.id).populate("posts followers following");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  res.status(200).json({
    success: true,
    user,
  });
});

export const getAllUsers = catchAsyncError(async (req, res) => {
  const users = await User.find({ name: {$regex: req.query.name, $options: "i"},});
  res.status(200).json({
    success: true,
    users,
  });
});
export const getMyPosts = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate(
        "likes comments.user owner"
      );
      posts.push(post);
    }
  res.status(200).json({
    success: true,
    posts,
  });
});
export const getUserPosts = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.params.id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate(
        "likes comments.user owner"
      );
      posts.push(post);
    }
  res.status(200).json({
    success: true,
    posts,
  });
});

export const forgotPassword = catchAsyncError(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found",
    });
  }

  const resetPasswordToken = user.getResetPasswordToken();

  await user.save();
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetPasswordToken}`;
  const message = `Reset Your Password by clicking on the link below:\n\n ${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Reset Password",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export const resetPassword = catchAsyncError(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Token is invalid or has expired",
    });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
