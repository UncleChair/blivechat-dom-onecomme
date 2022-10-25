const JSON_PATH = '../../comment.json'
const LIMIT = 40
const TIME_INTERVAL = 10000
const SYNC_CACHE = false
const GIFT_LIMIT = 10
const PRICE_COLOR = [
  { // RMB 1000红
    price: 1000,
    colors: {
      headerBg: 'rgba(208,0,0,1)',
      contentBg: 'rgba(230,33,23,1)',
      header: 'rgba(255,255,255,1)',
      content: 'rgba(255,255,255,1)'
    }
  },
  { // RMB 200 橙
    price: 100,
    colors: {
      headerBg: 'rgba(230,81,0,1)',
      contentBg: 'rgba(245,124,0,1)',
      header: 'rgba(255,255,255,0.87451)',
      content: 'rgba(255,255,255,0.87451)'
    }
  },
  { // RMB 50 黄
    price: 50,
    colors: {
      headerBg: 'rgba(255,179,0,1)',
      contentBg: 'rgba(255,202,40,1)',
      header: 'rgba(0,0,0,0.87451)',
      content: 'rgba(0,0,0,0.87451)'
    }
  },
  { // RMB 30 青绿色
    price: 30,
    colors: {
      headerBg: 'rgba(0,191,165,1)',
      contentBg: 'rgba(29,233,182,1)',
      header: 'rgba(0,0,0,1)',
      content: 'rgba(0,0,0,1)'
    }
  },
  { // RMB 1 蓝色
    price: 1,
    colors: {
      headerBg: 'rgba(21,101,192,1)',
      contentBg: 'rgba(30,136,229,1)',
      header: 'rgba(255,255,255,1)',
      content: 'rgba(255,255,255,1)'
    },
    pinTime: 0.4
  },
  { // RMB 0.1 青色
    price: 0.1,
    colors: {
      headerBg: 'rgba(119, 255, 246, 1)',
      contentBg: 'rgba(69, 230, 227, 1)',
      header: 'rgba(255,255,255,1)',
      content: 'rgba(255,255,255,1)'
    }
  },
  { // RMB 0 淡蓝
    price: 0,
    colors: {
      headerBg: 'rgba(153, 236, 255, 1)',
      contentBg: 'rgba(153, 236, 255, 1)',
      header: 'rgba(255,255,255,1)',
      content: 'rgba(255,255,255,1)'
    }
  }
]
const app = Vue.createApp({
  setup() {
    document.body.removeAttribute('hidden')
  },
  data() {
    return {
      comments: [],
      commentsWithMerge: [],
      commentsGiftList: []
    }
  },
  watch: {
    comments(newComments, oldComments) {
      if (newComments == []) {
        if (SYNC_CACHE) {
          this.commentsWithMerge = [];
        }
      }
      else {
        //获取新增消息，因为消息原始值只会增多
        let addComments = newComments.filter(item => !oldComments.includes(item));
        for (var addComment of addComments) {
          if (addComment.service == "bilibili") {
            if (addComment.data.hasOwnProperty("gift")) {
              let oldIndex = this.commentsWithMerge.findIndex(comment => comment.data.giftId == addComment.data.giftId && ((addComment.data.timestamp - comment.data.timestamp) < 10000));
              //console.error("Index is:", JSON.stringify(oldIndex));
              if (oldIndex != -1) {
                addComment.data.giftData.num += this.commentsWithMerge[oldIndex].data.giftData.num;
                this.commentsWithMerge.splice(oldIndex, 1, addComment);
                this.commentsGiftList.splice(oldIndex, 1, addComment);
              }
              else {
                this.commentsWithMerge.push(addComment);
                this.commentsGiftList.push(addComment);
              }
            }
            else {
              this.commentsWithMerge.push(addComment);
            }
          }
          else if (addComment.service == "youtube") {
            this.commentsWithMerge.push(addComment);
            if (addComment.data.hasGift) {
              this.commentsGiftList.push(addComment);
            }
          }
        }
        while (this.commentsWithMerge.length > LIMIT) {
          this.commentsWithMerge.shift();
        }
        while (this.commentsGiftList.length > GIFT_LIMIT) {
          this.commentsGiftList.shift();
        }
      }
    }
  },
  methods: {
    getPriceColor(priceLevel) {
      for (const config of PRICE_COLOR) {
        if (priceLevel >= config.price) {
          return config
        }
      }
    },
    //Only used on bilibili
    isCommentImg(comment) {
      if (comment.data.infoData[0][12] == 1) {
        return true
      }
      return false
    },
    getCommentImg(comment) {
      return comment.data.infoData[0][13].url
    },
    isFanGroup(comment) {
      if (comment.service == "bilibili") {
        let tempRoomId = comment.url.replace("https://live.bilibili.com/", "");
        if (comment.data.infoData[3][3] == tempRoomId) {
          return true
        }
        else {
          return false
        }
      }
      else if (comment.service == "youtube") {
        //油管消息不判断是否为粉丝团
        return false
      }
    },
    getTime(comment) {
      var time = new Date(comment.data.timestamp);
      let hours = time.getHours();
      let minutes = time.getMinutes();
      return hours + ":" + minutes
    },
    getAutherType(comment) {
      if (comment.service == "bilibili") {
        if (comment.data.infoData[7] > 0) {
          return "member"
        }
        else if (comment.data.isModerator) {
          return "moderator"
        }
        else if (comment.data.isOwner) {
          return "owner"
        }
        else {
          return ""
        }
      }
      else if (comment.service == "youtube") {
        if (comment.data.badges != []) {
          return "member"
        }
        else if (comment.data.isModerator) {
          return "moderator"
        }
        else if (comment.data.isOwner) {
          return "owner"
        }
        else {
          return ""
        }
      }
    },
    //基于Blivechat的对应分类
    getGiftType(comment) {
      if (comment.service == "bilibili") {
        if (comment.data.hasOwnProperty("guard")) {
          return 2
        }
        else if (comment.data.hasOwnProperty("gift")) {
          return 1
        }
        else if (comment.data.hasOwnProperty("superChatData")) {
          return 3
        }
      }
      else if (comment.service == "youtube") {
        if (comment.data.hasOwnProperty("superChatData")) {
          return 3
        }
      }
    },
    getGiftName(comment) {
      if (comment.service == "bilibili") {
        if (comment.data.hasOwnProperty("guard")) {
          return "membership"
        }
        else if (comment.data.hasOwnProperty("gift")) {
          return comment.data.gift.name
        }
        else if (comment.data.hasOwnProperty("superChatData")) {
          return "superchat"
        }
        else {
          return "Not paid message"
        }
      }
      else if (comment.service == "youtube") {
        return "superchat"
      }

    },
    getGiftNumber(comment) {
      return comment.data.giftData.num
    },
    getGiftPrice(comment) {
      if (comment.service == "bilibili") {
        if (comment.data.hasOwnProperty("gift")) {
          let tempPrice = 0.0;
          tempPrice = comment.data.giftData.num * comment.data.gift.price / 1000;
          if (comment.data.gift.coin_type == "silver") {
            return "0"
          }
          else {
            return tempPrice
          }
        }
        else {
          return comment.data.price;
        }
      }
      else if (comment.service == "youtube") {
        return comment.data.price;
      }
    },
    getGiftPriceLevel(comment) {
      let tempPrice = 0.0;
      if (comment.service == "bilibili") {
        if (comment.data.hasOwnProperty("gift")) {
          if (comment.data.gift.coin_type == "silver") {
            tempPrice = 0.0
          }
          else {
            tempPrice = comment.data.giftData.num * comment.data.gift.price / 1000;
          }
        }
        else {
          tempPrice = comment.data.price;
        }
        if (comment.data.hasOwnProperty("gift")) {
          if (comment.data.gift.coin_type == "silver") {
            return "0"
          }
        }
      }
      else if (comment.service == "youtube") {
        tempPrice = comment.data.price
      }
      if (tempPrice < 1) {
        return "0.1"
      }
      else if (tempPrice < 30) {
        return "1"
      }
      else if (tempPrice < 50) {
        return "30"
      }
      else if (tempPrice < 100) {
        return "50"
      }
      else if (tempPrice < 1000) {
        return "100"
      }
      else {
        return "1000"
      }
    }
  },
  mounted() {
    let cache = new Map()
    commentIndex = 0
    OneSDK.setup({
      jsonPath: JSON_PATH,
      commentLimit: LIMIT
    })
    OneSDK.subscribe({
      action: 'comments',
      callback: (comments) => {
        const newCache = new Map()
        comments.forEach(comment => {
          const index = cache.get(comment.data.id)
          if (isNaN(index)) {
            comment.commentIndex = commentIndex
            newCache.set(comment.data.id, commentIndex)
            ++commentIndex
          } else {
            comment.commentIndex = index
            newCache.set(comment.data.id, index)
          }
        })
        cache = newCache
        this.comments = comments
      }
    })
    OneSDK.connect()
  },
})
OneSDK.ready().then(() => {
  app.mount("#container");
})
