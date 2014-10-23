/**
 * Created by liuxing on 14-10-22.
 */
var api             = require('../../api'),
    template        = require('../template');
var next_post = function (options) {
    var data = (options || {}).hash ||{};
    var option =  {
        include :'author',
        limit : data.limit ? data.limit:1
    };
    return api.posts.nextRow(this.id,option).then(function(posts){
        return template.execute('relative_post', {posts:posts});
    });
};
module.exports = next_post;