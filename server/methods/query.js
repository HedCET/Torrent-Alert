Meteor.methods({

  query: function(query) {
    this.unblock();

    // var user = Meteor.user();
    // if (!user) throw new Meteor.Error(400, "userNotFound");

    check(query, String);

    var req = HTTP.call("GET", Random.choice(_torrentz_proxy) + query, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0',
      },
      npmRequestOptions: {
        proxy: Random.choice(_proxy),
      },
      timeout: 1000 * 60,
    });
    var res = {};

    if (req.statusCode === 200) {
      var $ = Meteor.npmRequire("cheerio").load(req.content);

      if (-1 < query.indexOf('?')) { // torrent
        res.count = +_.first($('.results h2').children().remove().end().text().split(/torrents/i)).replace(/[^0-9]/g, '');
        res.torrent = [];

        $(".results dl").each(function() {
          if ($(this).find("dt a").attr("href")) {
            res.torrent.push({

              title: $(this).find("dt a").text(),
              query: $(this).find("dt a").attr("href"),
              category: $(this).find("dt").children().remove().end().text().replace(/[^0-9a-z ]/gi, " ").trim().replace(/\s+/g, " "),

              insert_time: ($(this).find("dd .a span").attr("title") ? moment($(this).find("dd .a span").attr("title"), "ddd, DD MMM YYYY HH:mm:ss").toDate() : moment().toDate()),
              leech: +$(this).find("dd .u").text().replace(/[^0-9]/g, ""),
              seed: +$(this).find("dd .d").text().replace(/[^0-9]/g, ""),
              size: $(this).find("dd .s").text().replace(/[^0-9a-z]/gi, ""),

            });
          }
        });
      } else { // url
        res.url = [];

        $(".download dl").each(function() {
          if ($(this).find("dt a").attr("href")) {
            var url = $(this).find("dt a").attr("href");

            if (url.substr(0, 4) == "http") {
              res.url.push({
                insert_time: ($(this).find("dd span").attr("title") ? moment($(this).find("dd span").attr("title"), "ddd, DD MMM YYYY HH:mm:ss").toDate() : moment().toDate()),
                url: url,
              });
            }
          }
        });
      }
    } else {
      console.log('query HTTP.call()', query);
    }

    return res;
  },

});