const express = require('express');
const bodyParser = require('body-parser');

const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const app = express();
const config = require('./config/config').get(process.env.NODE_ENV);


mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE, { useNewUrlParser: true });
mongoose.set('useFindAndModify', false);
const { User } = require('./models/user');
const { Book } = require('./models/book');
const { auth } = require('./middleware/auth');

app.use(bodyParser.json());
app.use(cookieParser());

// 요청을 시작 
// 라우터 추가 

app.get('/api/logout', auth, (req, res)=>{
		// 
		res.send(req.user)
})


// get 
app.get('/api/getBook', (req, res)=>{
	let id = req.query.id;
	Book.findById(id, (err,doc)=>{
		if(err) return res.status(400).send(err);
		res.send(doc)
	})
})
app.get('/api/books', (req,res)=>{
	//localhost:3001/api/books?skip=3&limit=2&order=asc
	let skip = parseInt(req.query.skip);
	let limit = parseInt(req.query.limit);
	let order = req.query.order;

	// order = asc || desc
	Book.find().skip(skip).sort({ _id: order }).limit(limit)
	.exec((err, doc)=>{
		if(err) return res.status(400).send(err);
		res.send(doc);
	})
})

// post 
app.post('/api/book', (req, res)=>{
	const book = new Book(req.body);
  book.save((err, doc)=>{
		if(err) return res.status(400).send(err);
		res.status(200).json({
			 post: true,
			 bookId: doc._id
		})
	})
	
})
// update
app.post('/api/book_update', (req,res)=>{
		Book.findByIdAndUpdate(req.body._id, req.body, {new: true}, (err,doc) => {
			 if(err) return res.status(400).send(err);
			 res.json({
				  success: true,
					doc
			 })
		})
})

// delete 
app.delete('/api/delete_book', (req,res)=>{
	 let id = req.query.id;
	 Book.findByIdAndRemove(id, (err, doc)=>{
		 if(err) return res.status(400).send(err);
		 res.json(true)
	 })
})

app.post('/api/register', (req, res)=>{
	const user = new User(req.body);
	user.save((err, doc)=>{
		if(err) return res.json({ success: false });
		res.status(200).json({
			success: true,
			user: doc
		})
	})
})

app.post('/api/login', (req, res)=>{

		User.findOne({'email': req.body.email }, (err, user)=>{
				if(!user) return res.json({ isAuth: false, message: 'Auth failed wrong email' })

		user.comparePassword(req.body.password, (err, isMatch)=>{
						if(!isMatch) return res.json({
							isAuth: false,
							message: 'wrong password'
						});

						user.generateToken((err, user)=>{
								if(err) return res.status(400).send(err);
								res.cookie('auth', user.token).json({
											isAuth: true,
											id: user._id,
											email: user.email
								})
						})
				})
		})
})

app.get('/api/users', (req, res)=>{
		User.find({}, (err, users)=>{
				if(err) return res.status(400).send(err);
				res.status(200).send(users)
		})
})

app.get('/api/user_posts', (req, res)=> {
		Book.find({
				ownerId: req.query.user
		}).exec((err, docs)=>{
				if(err) return res.status(400).send(err);
				res.send(docs)
		})
})



app.get('/api/getReviewer', (req, res)=>{
		let id = req.query.id;
		User.findById(id, (err, doc)=>{
				if(err) return res.status(400).send(err);
				res.json({
						name: doc.name,
						lastname: doc.lastname
				})
		})
})


const port = process.env.PORT || 3001;
app.listen(port, ()=> {
	console.log(`server running`)
})