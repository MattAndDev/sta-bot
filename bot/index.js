const puppeteer = require('puppeteer')
const {
  likePost,
  likePostsFromUser,
  login,
  getHashtagPosts,
  getPostInfo
} = require('./actions')

const bot = async ({ cred, search, like }) => {
  const browser = await puppeteer.launch({
    // headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()
  const isLoggeIn = await login(page, cred.usr, cred.pwd)
  console.log(`Logged in: ${isLoggeIn}`)
  const posts = await getHashtagPosts(page, search.hash)
  console.log(`Posts found: ${JSON.stringify(posts, null, 2)}`)
  const infoPosts = await getPostInfo(page, posts)
  console.log(`Info of posts found: ${JSON.stringify(infoPosts, null, 2)}`)
  const likedPosts = []
  for (var i = 0; i < infoPosts.length; i++) {
    const { user, post } = infoPosts[i]
    if (user.followers <= like.maxNumberOfFollowers) {
      const likedPost = await likePost(page, { url: post.url })
      const likedPostsFromUser = await likePostsFromUser(page, user.url, like.maxPostsToLikePerUser)
      infoPosts[i].likedPosts = likedPostsFromUser
      likedPosts.push(infoPosts[i])
    }
  }
  const cleanData = likedPosts.map(p => ({
    user: p.user.url,
    firstPost: p.post.url,
    liked: p.likedPosts
  }))
  browser.close()
  return { hashtag: search.hash, results: cleanData }
}

module.exports = {
  bot
}
