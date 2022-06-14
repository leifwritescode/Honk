/**
 * Load environment data
 */
require('dotenv').config();

/**
 * Reddit API imports
 */
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

/**
 * Regular expressions for finding geese.
 * Searches for 'goose', 'gooses', 'geese', 'gosling' and 'goslings'.
 * Matches must appear on a word boundary and not be hypenated, e.g. mongoose and goose-step are ignored.
 */
const gooseRegex = /\b(?!\S*["-])(gooses?|geese|goslings?)\b/gmi;

/**
 * Regular expressions for identifying good bots and bad bots
 */
const goodBotRegex = /(good bot)/gmi;
const badBotRegex = /(bad bot)/gmi;

const iAmABot = `\n*****\nI am a bot, and this drive-by honking was automatic.`;

/**
 * The supported honks
 */
const honkNeutral   = `###HONK HONK HONK`;
const honkSeductive = `###HONK but seductively`;
const honkHiss      = `###HISSSSS`;

/**
 * Debug categories
 */
const verbose = require('debug')('snoo-verbose');
const debug = require('debug')('snoo-debug');
const info = require('debug')('goose-info');

/**
 * Creates wrapper for Reddit API
 */ 
const r = new Snoowrap({
    userAgent: 'honks loudly (Suddenly_Geese)',
    clientId: process.env.Client,
    clientSecret: process.env.Secret,
    username: process.env.User,
    password: process.env.Pass
});

/**
 * Create an event wrapper around the Snoowrap instance
 */
const client = new Snoostorm(r);

/**
 * Stream from r/all, 100 things per poll
 */
const streamOpts =
{
    subreddit: 'all',
    results: 100
};

/**
 *  Create the CommentStream, using the above configuration
 */
const comments = client.CommentStream(streamOpts);

/**
 * @summary doHonk
 * @description replies to the comment with the honk
 * @param {*} comment the comment to reply to
 * @param {string} theHonk the honk to reply with
 */
const doHonk = (comment, theHonk) =>
{
    info(`Honking '${theHonk}' at u/${comment.author.name}.\nComment was: ${comment.body}`);
    comment.reply(`${theHonk}${iAmABot}`);
}

/**
 * @summary checkAndDoNeutralHonk
 * @description checks if we should honk neutrally first, honking if so
 * @param {*} comment the comment to reply to
 * @returns {bool} true if we honked, otherwise false
 */
const checkAndDoNeutralHonk = (comment) =>
{
    // test for geese
    var didHonk = gooseRegex.test(comment.body);
    verbose(`Neutral Honk Check CommentID=${comment.id} Pass=${didHonk}`);

    // honk if geese were found
    if (didHonk)
    {
        doHonk(comment, honkNeutral);
    }

    return didHonk;
}

/**
 * Main Loop
 * If we were the commenter, bail
 * If the comment is a reply
 *      check for GB/BB and honk/hiss if we were the recipient
 *      If not a GB/BB, check if it is a goose mention
 * Else check if it is a goose mention
 */
comments.on('comment', comment =>
{
    verbose(`LinkID=${comment.link_id},ParentID=${comment.parent_id},ID=${comment.id}`);

    // extract the information we refer to + set up other vars
    var c_name          = comment.author.name,
        c_body          = comment.body,
        p_id            = comment.parent_id,
        isResponseHonk  = true,
        tempHonk        = "";

    // don't honk at ourselves
    if (c_name == process.env.User) return;

    // check for good bot bad bot in chain
    // if not gb/bb, check if we should neutral honk
    if (p_id.includes("t1_"))
    {
        // first check for good bot
        if (goodBotRegex.test(c_body))
        {
            tempHonk = honkSeductive;
        
        }
        // or bad bot
        else if (badBotRegex.test(c_body))
        {
            tempHonk = honkHiss;
        
        }
        // don't honk yet if it's neither
        else
        {
            isResponseHonk = false;
        }

        // if we've picked up a goodbot/badbot, we might need to honk
        if (isResponseHonk)
        {
            // get the parent id
            p_id = p_id.replace("t1_","");
        
            // and then get the parent name
            r.getComment(p_id).author.name.then((p_name) =>
            {
                // check that the parent to the current comment was one of our honks
                isResponseHonk = p_name == process.env.User;
                debug(`GoodBot/BadBot Check User=${p_name}, Pass=${isResponseHonk}`);
            
                // if it was, we'll either honk seductively or hiss
                if (isResponseHonk)
                {
                    doHonk(comment, tempHonk);
                }
            });
        }
        else
        {
            // check if this one requires a neutral honk
            checkAndDoNeutralHonk(comment);
        }
    }
    else
    {
        // root comment, check for neutral honk
        checkAndDoNeutralHonk(comment);
    }
});

/**
 * And we're off!
 */
info("And then suddenly, Geese!");
