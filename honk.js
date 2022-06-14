/* get account data */
require('dotenv').config();

/* regular expression to find geese */
const gooseRegex = /\b(gooses?|geese|goslings?|gaggle)\b/;

/* HONK */
const honk = `###HONK HONK HONK`;

/* Reddit API imports */
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

/* debug mode */
const debug = require('debug')('reddit');

/* creates wrapper for Reddit API */
const r = new Snoowrap({
    userAgent: 'honks loudly (Suddenly_Geese)',
    clientId: process.env.Client,
    clientSecret: process.env.Secret,
    username: process.env.User,
    password: process.env.Pass
});

/* event wrapper for Snoo */
const client = new Snoostorm(r);

/* get everything from all and get 100 at a time */
const streamOpts = {
    subreddit: 'all',
    results: 100
};

/* get comments per StreamOpts */
const comments = client.CommentStream(streamOpts);

/* honk aggressively */
comments.on('comment', comment => {
    if (comment.author.name == process.env.User) return;

    debug(`${comment.author.name} in ${comment.subreddit.display_name}`);
    var isGoose = gooseRegex.test(comment.body);
    if (isGoose) {
        console.log(`HONK: ${comment.body}`);
        comment.reply(honk);   
    }
});
