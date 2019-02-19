/**
 * login to instagram
 *
 * @param {object} page - pupeteer page instance.
 * @param {string} usr - instagram user.
 * @param {string} pwd - instagram password.
 * @return {object} - HoneyBem instance.
 */

const login = async (page, usr, pwd) => {
  const instaLoginUrl = 'https://www.instagram.com/accounts/login/'
  await page.goto(instaLoginUrl, { waitUntil: 'networkidle0' })
  const userField = await page.$('[name="username"]')
  await userField.type(usr)
  const pwdField = await page.$('[name="password"]')
  await pwdField.type(pwd)
  const awaitLogin = page.waitForNavigation({ waitUntil: 'networkidle0' })
  await page.click('button[type="submit"]')
  await awaitLogin
  return true
}

/**
 * login to instagram
 *
 * @param {object} page - pupeteer page instance.
 * @param {string} hashtag - tag/hash tag to navitae to (withouth #)
 * @return {array} - array of urls scraped from the page
 */

const getHashtagPosts = async (page, hashtag) => {
  await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, { waitUntil: 'networkidle0' })
  const posts = []
  const links = await page.$$eval('a', anchors => [].map.call(anchors, a => a.href))
  for (var i = 0; i < links.length; i++) {
    // assuming link matching /p/ represent a post
    if (links[i].match(/\/p\/\.*/)) {
      posts.push({
        id: links[i].split('/')[links[i].split('/').length - 2],
        url: links[i]
      })
    }
  }
  return posts
}

const getPostInfo = async (page, posts) => {
  const ps = []
  for (let i = 0; i < posts.length; i += 1) {
    const p = { post: { ...posts[i] }, user: {} }
    const { url: postUrl, id: postId } = posts[i]
    await page.goto(postUrl, { waitUntil: 'networkidle0' })
    const likes = await page.$(`[href="/p/${postId}/liked_by/"]`)
    const likesHtml = (likes) ? await page.evaluate(e => (e.querySelector('span')) ? e.querySelector('span').innerHTML : '1', likes) : '0'
    p.post.likes = parseInt(likesHtml.replace(',', ''), 10)
    const title = await page.$('h2')
    const userProfile = await page.evaluate(e => (e && e.querySelector('a')) ? e.querySelector('a').href : undefined, title)
    p.user.url = userProfile
    await page.goto(userProfile)
    const [_, name] = userProfile.split('/').reverse()
    p.user.name = name
    const followersLink = await page.$(`[href="/${name}/followers/"]`)
    const followersHtml = await page.evaluate(e => (e.querySelector('span')) ? e.querySelector('span').innerHTML : '0', followersLink)
    let followers = 0
    if (followersHtml.includes('k')) {
      followers = parseFloat(followersHtml) * 1000
    } else if (followersHtml.includes('mio')) {
      followers = parseFloat(followersHtml) * 1000000
    } else {
      followers = parseInt(followersHtml.match(/\d/g).join(''), 10)
    }
    p.user.followers = followers
    ps.push(p)
  }
  return ps
}

const likePost = async (page, { url }) => {
  await page.goto(url, { waitUntil: 'networkidle0' })
  const canBeLiked = await page.$(`[aria-label="Like"`)
  if (canBeLiked) {
    await page.click(`[aria-label="Like"`)
  }
  return false
}

const likePostsFromUser = async (page, url, n = 7) => {
  await page.goto(url, { waitUntil: 'networkidle0' })
  const links = await page.$$eval('a', anchors => [].map.call(anchors, a => a.href))
  const posts = links.filter(l => l.match(/\/p\/\.*/))
  const shuffled = posts.sort(() => (0.5 - Math.random()))
  let selected
  if (shuffled.length > n) {
    selected = shuffled.slice(0, n)
  } else {
    selected = shuffled
  }
  for (var i = 0; i < selected.length; i++) {
    await likePost(page, { url: selected[i] })
  }
  return selected
}

module.exports = {
  login,
  likePost,
  likePostsFromUser,
  getHashtagPosts,
  getPostInfo
}
