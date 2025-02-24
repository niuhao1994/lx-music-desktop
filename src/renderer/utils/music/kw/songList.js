import { httpFatch } from '../../request'
import { formatPlayTime, decodeName } from '../../index'
import { formatSinger } from './util'

export default {
  _requestObj_tags: null,
  _requestObj_hotTags: null,
  _requestObj_list: null,
  _requestObj_listDetail: null,
  limit_list: 25,
  limit_song: 100,
  successCode: 200,
  sortList: [
    {
      name: '最新',
      id: 'new',
    },
    {
      name: '最热',
      id: 'hot',
    },
  ],
  tagsUrl: 'http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576',
  hotTagUrl: 'http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmTagList?loginUid=0&loginSid=0&appUid=76039576',
  getListUrl({ sortId, id, type, page }) {
    if (!id) return `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page}&rn=${this.limit_list}&order=${sortId}`
    switch (type) {
      case '10000': return `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&id=${id}&rn=${this.limit_list}`
      case '43': return `http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${id}&prod=pc`
    }
    // http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&id=173&pn=1&rn=100
  },
  getListDetailUrl(id, page) {
    // http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=2858093057&pn=0&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1
    return `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}&rn=${this.limit_song}&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`
    // http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=140&prod=pc
  },

  // http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=2849349915&pn=0&rn=100&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1
  // 获取标签
  getTag() {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    this._requestObj_tags = httpFatch(this.tagsUrl)
    return this._requestObj_tags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getTag()
      return this.filterTagInfo(body.data)
    })
  },
  // 获取标签
  getHotTag() {
    if (this._requestObj_hotTags) this._requestObj_hotTags.cancelHttp()
    this._requestObj_hotTags = httpFatch(this.hotTagUrl)
    return this._requestObj_hotTags.promise.then(({ body }) => {
      if (body.code !== this.successCode) return this.getHotTag()
      return this.filterInfoHotTag(body.data[0].data)
    })
  },
  filterInfoHotTag(rawList) {
    return rawList.map(item => ({
      id: `${item.id}-${item.digest}`,
      name: item.name,
    }))
  },
  filterTagInfo(rawList) {
    return rawList.map(type => ({
      name: type.name,
      list: type.data.map(item => ({
        parent_id: type.id,
        parent_name: type.name,
        id: `${item.id}-${item.digest}`,
        name: item.name,
      })),
    }))
  },

  // 获取列表数据
  getList(sortId, tagId, page) {
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    let id
    let type
    if (tagId) {
      let arr = tagId.split('-')
      id = arr[0]
      type = arr[1]
    } else {
      id = null
    }
    this._requestObj_list = httpFatch(this.getListUrl({ sortId, id, type, page }))
    return this._requestObj_list.promise.then(({ body }) => {
      if (!id || type == '10000') {
        if (body.code !== this.successCode) return this.getListUrl({ sortId, id, type, page })
        return {
          list: this.filterList(body.data.data),
          total: body.data.total,
          page: body.data.pn,
          limit: body.data.rn,
        }
      } else if (!body.length) {
        return this.getListUrl({ sortId, id, type, page })
      }
      return {
        list: this.filterList2(body),
        total: 1000,
        page,
        limit: 1000,
      }
    })
  },


  /**
   * 格式化播放数量
   * @param {*} num
   */
  formatPlayCount(num) {
    if (num > 100000000) return parseInt(num / 10000000) / 10 + '亿'
    if (num > 10000) return parseInt(num / 1000) / 10 + '万'
    return num
  },
  filterList(rawData) {
    return rawData.map(item => ({
      play_count: this.formatPlayCount(item.listencnt),
      id: item.id,
      author: item.uname,
      name: item.name,
      // time: item.publish_time,
      img: item.img,
      grade: item.favorcnt / 10,
      desc: item.desc,
    }))
  },
  filterList2(rawData) {
    const list = []
    rawData.forEach(item => {
      if (!item.label) return
      list.push(...item.list.map(item => ({
        play_count: item.play_count === undefined ? null : this.formatPlayCount(item.listencnt),
        id: item.id,
        author: item.uname,
        name: item.name,
        // time: item.publish_time,
        img: item.img,
        grade: item.favorcnt / 10,
        desc: item.desc,
      })))
    })
    return list
  },

  // 获取歌曲列表内的音乐
  getListDetail(id, page) {
    if (this._requestObj_listDetail) {
      this._requestObj_listDetail.cancelHttp()
    }
    this._requestObj_listDetail = httpFatch(this.getListDetailUrl(id, page))
    return this._requestObj_listDetail.promise.then(({ body }) => {
      if (body.result !== 'ok') return this.getListDetail(id, page)
      return {
        list: this.filterListDetail(body.musiclist),
        page,
        limit: body.rn,
        total: body.total,
      }
    })
  },
  filterListDetail(rawData) {
    // console.log(rawList)
    return rawData.map((item, inedx) => {
      let formats = item.formats.split('|')
      let types = []
      let _types = {}
      if (formats.indexOf('MP3128')) {
        types.push({ type: '128k', size: null })
        _types['128k'] = {
          size: null,
        }
      }
      if (formats.indexOf('MP3H')) {
        types.push({ type: '320k', size: null })
        _types['320k'] = {
          size: null,
        }
      }
      if (formats.indexOf('ALFLAC')) {
        types.push({ type: 'flac', size: null })
        _types['flac'] = {
          size: null,
        }
      }

      return {
        singer: formatSinger(decodeName(item.artist)),
        name: decodeName(item.name),
        albumName: decodeName(item.album),
        albumId: item.albumid,
        songmid: item.id,
        source: 'kw',
        interval: formatPlayTime(parseInt(item.duration)),
        img: null,
        lrc: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },
  getTags() {
    return Promise.all([this.getTag(), this.getHotTag()]).then(([tags, hotTag]) => ({ tags, hotTag }))
  },
}

// getList
// getTags
// getListDetail
