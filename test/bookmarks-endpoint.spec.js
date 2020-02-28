const {expect} = require('chai');
const {API_TOKEN} = require('../src/config');
const knex = require('knex');
const app = require('../src/app');
const makeBookmarkArray = require('./bookmarks.fixture');

describe('Bookmarks Endpoints', function () {
  let db;

  before('make knex instance', () => {

    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('bookmark').truncate());
  afterEach('cleanup', () => db('bookmark').truncate());

  describe(`GET /bookmarks`, () => {
    context(`Given no articles`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(200, []);
      });
    });
  });

  describe(`GET /bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 100;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(404, {
            error: {
              message: `bookmark doesn't exist`
            }
          })
      });
    });
  });

  context('Given there are bookmarks in the database', () => {
    const testBookmarks = makeBookmarkArray();

    beforeEach('insert bookmark', () => {
      return db
        .into('bookmark')
        .insert(testBookmarks);
    });

    it('Get/bookmarks responds with 200 and all of the bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', 'Bearer ' + API_TOKEN)
        .expect(200, testBookmarks);
    });

    it('GET /bookmarks/:bookmarks_id responds with 200 and the specified article', () => {
      const bookId = 2;
      const expectedBook = testBookmarks[bookId - 1];
      return supertest(app)
        .get(`/bookmarks/${bookId}`)
        .set('Authorization', 'Bearer ' + API_TOKEN)
        .expect(200, expectedBook);
    });
  });


  describe(`POST /bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new book`, function () {
      this.retries(4);
      const newBookmark = {
        title: 'Test new article',
        url: 'https://example.com',
        description: 'Test new article content...',
        rating: 5
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization', 'Bearer ' + API_TOKEN)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
        })
        .then(postRes =>  supertest(app)
          .get(`/bookmarks/${postRes.body.id}`)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(postRes.body)
        );
    });

    it('rating is not between 1 and 5', ()=>{
      return supertest(app)
        .post('/bookmarks')
        .send({
          title:'My new book',
          url: 'https://example.com',
          description:'The new story',
          rating:7
        })
        .set('Authorization', 'Bearer ' + API_TOKEN)
        .expect(400, {
          error: { message: `rating should be a number between 1 and 5` }
        });
    });

    const requireFields =['title', 'url', 'description', 'rating'];

    requireFields.forEach(field =>{
      const newBook ={
        title:'My new book',
        url: 'https://example.com',
        description:'The new story',
        rating:4
      };
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBook[field];
        
        return supertest(app)
          .post('/bookmarks')
          .send(newBook)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });

    });
 
    
  });

  describe(`DELETE /bookmarks/:bookmark_id`, () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarkArray();
    
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark')
          .insert(testBookmarks);
      });
    
      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectBooks = testBookmarks.filter(book => book.id !== idToRemove);
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/bookmarks`)
              .set('Authorization', 'Bearer ' + API_TOKEN)
              .expect(expectBooks)
          );
          
      });
    });
    context(`Given no articles`, () => {
      it(`responds with 404`, () => {
        const bookId = 12;
        return supertest(app)
          .delete(`/bookmarks/${bookId}`)
          .set('Authorization', 'Bearer ' + API_TOKEN)
          .expect(404, { error: { message: `bookmark doesn't exist` } 
          });
      });
    });

  });
});