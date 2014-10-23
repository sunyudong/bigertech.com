// # Posts API
// RESTful API for the Post resource
var Promise         = require('bluebird'),
    _               = require('lodash'),
    dataProvider    = require('../models'),
    canThis         = require('../permissions').canThis,
    errors          = require('../errors'),
    utils           = require('./utils'),

    docName         = 'posts',
    allowedIncludes = ['created_by', 'updated_by', 'published_by', 'author', 'tags', 'fields'],
    posts;

// ## Helpers
function prepareInclude(include) {
    var index;

    include = _.intersection(include.split(','), allowedIncludes);
    index = include.indexOf('author');

    if (index !== -1) {
        include[index] = 'author_id';
    }

    return include;
}

/**
 * ## Posts API Methods
 *
 * **See:** [API Methods](index.js.html#api%20methods)
 */
posts = {
    //add by liuxing
    findByIn: function findByIn(ids) {
        if (_.isEmpty(ids) || !_.isArray(ids)) {
            return Promise.resolve([]);
        }
        return dataProvider.Posts.query(function(qb) {
            qb.where({status: 'published'}).where('id', 'IN', ids);
        }).fetch({
            withRelated: ['author_id']
        }).then(function(result) {
            _.each(result.models, function (item) {
                item.include = ['author_id'];
            });
            return Promise.resolve(result.toJSON());
        })
    },
    //end add
    /**
     * ### Browse
     * Find a paginated set of posts
     *
     * Will only return published posts unless we have an authenticated user and an alternative status
     * parameter.
     *
     * Will return without static pages unless told otherwise
     *
     * Can return posts for a particular tag by passing a tag slug in
     *
     * @public
     * @param {{context, page, limit, status, staticPages, tag}} options (optional)
     * @noTopic 是否包含主题文章
     * @returns {Promise(Posts)} Posts Collection with Meta
     */
    browse: function browse(options,noTipic) {
        options = options || {};

        if (!(options.context && options.context.user)) {
            options.status = 'published';
        }

        if (options.include) {
            options.include = prepareInclude(options.include);
        }
        if(noTipic){
            return dataProvider.Post.findPageNoTopic(options);
        }
        return dataProvider.Post.findPage(options);
    },

    /**
     * ### Read
     * Find a post, by ID or Slug
     *
     * @public
     * @param {{id_or_slug (required), context, status, include, ...}} options
     * @return {Promise(Post)} Post
     */
    read: function read(options) {
        var attrs = ['id', 'slug', 'status'],
            data = _.pick(options, attrs);
        options = _.omit(options, attrs);

        // only published posts if no user is present
        if (!(options.context && options.context.user)) {
            data.status = 'published';
        }

        if (options.include) {
            options.include = prepareInclude(options.include);
        }

        return dataProvider.Post.findOne(data, options).then(function (result) {
            if (result) {
                return { posts: [ result.toJSON() ]};
            }

            return Promise.reject(new errors.NotFoundError('Post not found.'));
        });
    },
    //add by liuxing
    nextRow: function nextRow(id,options) {
        var attrs = ['id', 'slug', 'status'],
            data = _.pick(options, attrs);
        options = _.omit(options, attrs);

        // only published posts if no user is present

        if (options.include) {
            options.include = prepareInclude(options.include);
        }
        return dataProvider.Post.nextRow(id,data, options).then(function (result) {
            if (result) {
                return  result.toJSON();
            }

            return when.reject(new errors.NotFoundError('Post not found.'));
        });
     },
    preRow: function nextRow(id,options) {
        var attrs = ['id', 'slug', 'status'],
            data = _.pick(options, attrs);
        options = _.omit(options, attrs);

        // only published posts if no user is present
        if (options.include) {
            options.include = prepareInclude(options.include);
        }
        return dataProvider.Post.preRow(id,data, options).then(function (result) {
            if (result) {
                return  result.toJSON();
            }
            return when.reject(new errors.NotFoundError('Post not found.'));
        });
    },
     /**
     * ### Read
     * Find a post, by ID or Slug
     *
     * @public
     * @param {{id_or_slug (required), context, status, include, ...}} options
     * @return {Promise(Post)} Post
     */
    findRelate: function read(options) {
        var attrs = ['id', 'slug', 'status','post_type'],
            data = _.pick(options, attrs);
            options = _.omit(options, attrs);

        // only published posts if no user is present
        if (!(options.context && options.context.user)) {
            data.status = 'published';
        }

        if (options.include) {
            options.include = prepareInclude(options.include);
        }
        return dataProvider.Post.findRelate(data, options).then(function (result) {
            if (result) {
                var data = _.filter(result.toJSON(),function(post){ //排除掉自己
                   return post.title !== options.title;
                });
                var size = data.length - options.limit;

                if( size > -1 ){  //返回指定数量的数据
                    data.pop();
                }
                return {relatePosts:data};
            }
            return when.reject(new errors.NotFoundError('Post not found.'));
        });
    },
    //

    /**
     * ### Edit
     * Update properties of a post
     *
     * @public
     * @param {Post} object Post or specific properties to update
     * @param {{id (required), context, include,...}} options
     * @return {Promise(Post)} Edited Post
     */
    edit: function edit(object, options) {
        return canThis(options.context).edit.post(options.id).then(function () {
            return utils.checkObject(object, docName).then(function (checkedPostData) {
                if (options.include) {
                    options.include = prepareInclude(options.include);
                }

                return dataProvider.Post.edit(checkedPostData.posts[0], options);
            }).then(function (result) {
                if (result) {
                    var post = result.toJSON();

                    // If previously was not published and now is (or vice versa), signal the change
                    post.statusChanged = false;
                    if (result.updated('status') !== result.get('status')) {
                        post.statusChanged = true;
                    }
                    return {posts: [post]};
                }

                return Promise.reject(new errors.NotFoundError('Post not found.'));
            });
        }, function () {
            return Promise.reject(new errors.NoPermissionError('You do not have permission to edit posts.'));
        });
    },

    /**
     * ### Add
     * Create a new post along with any tags
     *
     * @public
     * @param {Post} object
     * @param {{context, include,...}} options
     * @return {Promise(Post)} Created Post
     */
    add: function add(object, options) {
        options = options || {};

        return canThis(options.context).add.post().then(function () {
            return utils.checkObject(object, docName).then(function (checkedPostData) {
                if (options.include) {
                    options.include = prepareInclude(options.include);
                }

                return dataProvider.Post.add(checkedPostData.posts[0], options);
            }).then(function (result) {
                var post = result.toJSON();

                if (post.status === 'published') {
                    // When creating a new post that is published right now, signal the change
                    post.statusChanged = true;
                }
                return {posts: [post]};
            });
        }, function () {
            return Promise.reject(new errors.NoPermissionError('You do not have permission to add posts.'));
        });
    },

    /**
     * ### Destroy
     * Delete a post, cleans up tag relations, but not unused tags
     *
     * @public
     * @param {{id (required), context,...}} options
     * @return {Promise(Post)} Deleted Post
     */
    destroy: function destroy(options) {
        return canThis(options.context).destroy.post(options.id).then(function () {
            var readOptions = _.extend({}, options, {status: 'all'});
            return posts.read(readOptions).then(function (result) {
                return dataProvider.Post.destroy(options).then(function () {
                    var deletedObj = result;

                    if (deletedObj.posts) {
                        _.each(deletedObj.posts, function (post) {
                            post.statusChanged = true;
                        });
                    }

                    return deletedObj;
                });
            });
        }, function () {
            return Promise.reject(new errors.NoPermissionError('You do not have permission to remove posts.'));
        });
    }

};

module.exports = posts;
