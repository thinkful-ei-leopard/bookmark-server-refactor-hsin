const express = require('express');
const bookmarkRouter = express.Router();
const bodyParser = express.json();
const uuid = require('uuid/v4');
const logger = require('../logger');
const store= require('../store');
const jsonParser = express.json();
const BookmarkService=require('./bookmark-service');



/*bookmarkRouter
  .route('/bookmarks')
  .get(bodyParser, (req, res)=>{
    res.json(store);
  })
  .post(bodyParser, (req, res) =>{
    const { title, url, description, rating } = req.body;
    if(!title){
      logger.error('Title is required');
      return res.status(400).send('Invalid data of title')
    }
        
    if(!url){
      logger.error('url is required');
      return res.status(400).send('Invalid data of url')
    }
    if(!description){
      logger.error('description is required');
      return res.status(400).send('Invalid data of description')
    }
    if(!rating){
      logger.error('rating is required');
      return res.status(400).send('Invalid data of rating')
    }
    
    const id =uuid();
    
    const bookmark ={
      id,
      title,
      url,
      description,
      rating
    };
    
    store.push(bookmark);
    
    logger.info(`Bookmark with id ${id} created`);
    
    res
      .status(201)
      .location(`http://localhost:8000/store/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .get(bodyParser, (req, res)=>{
    const { id } = req.params;
    const bookmark = store.find(b => b.id === id);
        
    if(!bookmark){
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send('Bookmark Not Found');
    }
    res.json(bookmark);
  })
  .delete(bodyParser, (req, res) => {
    const {id} = req.params;
    const index = store.findIndex(u => u.id === id);
      
    if(index === -1){
      logger.error(`Bookmark with id ${id} not found`)
      return res
        .status(404)
        .send('Id not found');
    }
    store.splice(index, 1);
      
    logger.info(`Bookmark with id ${id} deleted`);
    res.status(204).end();
  });*/

bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    BookmarkService.getAllbookmark(
      req.app.get('db')
    )
      .then(book => {
        res.json(book);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBook = { title, url, description, rating};

    for(const [key, value] of Object.entries(newBook)){
      if(value == null){
        return res.status(400).json({
          error:{
            message: `Missing '${key}' in request body`
          }
        });
      }
    }

    if(rating >5){
      return res.status(400).json({
        error:{
          message:'rating should be a number between 1 and 5'
        }
      });
    }
    BookmarkService.insertBookmark(
      req.app.get('db'),
      newBook
    )
      .then(book => {
        res
          .status(201)
          .location(`/bookmarks/${book.id}`)
          .json(book);
      })
      .catch(next);
  });

bookmarkRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    BookmarkService.getById(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `bookmark doesn't exist` }
          });
        }
        res.bookmark = bookmark ;// save the article for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.bookmark.id,
      title: res.bookmark.title,
      url: res.bookmark.url,
      description: res.bookmark.description,
      rating: res.bookmark.rating
    });
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarkService.deleteBookmark(
      knexInstance,
      req.params.bookmark_id
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });



module.exports=bookmarkRouter;