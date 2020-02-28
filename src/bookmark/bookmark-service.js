const BookmarkService ={
  getAllbookmark(knex){
    return knex.select('*').from('bookmark');
  },

  getById(knex, id){
    return knex.from('bookmark').select('*').where('id', id).first();
  },

  insertBookmark(knex, newBook){
    return knex
      .insert(newBook)
      .into('bookmark')
      .returning('*')
      .then(book =>{
        return book[0];
      });
  },

  deleteBookmark(knex, id){
    return knex('bookmark')
      .where({id})
      .delete();
  }
  

};

module.exports=BookmarkService;