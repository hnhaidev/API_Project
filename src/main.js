$(function () {
    let apiKey = "AIzaSyAk2dE7yFXvgtFrljZ7xh4BRnxIr50xfxI";
    let regionCd = "VN";
    let isPlay = false;
    let player;

    let typed = new Typed('.animate-content', {
        strings: [
            "Search for videos from youtube.",
            "See top trending youtube.",
            "Create playlist."
        ],
        typeSpeed: 50,
        backSpeed: 50,
        loop: true
    });

    $(".logo").click(function (e) { 
        localStorage.clear();
    });

    //loading
    $(window).on("load",function(){
        $(".loader-wrapper").fadeOut(2000);
    });
    function loading() {
        $(".loader-wrapper").fadeIn();
        $(".loader-wrapper").fadeOut(1500);
    }

    // bat su kien enter
    $('#keyword').keypress((e) => {
        if (e.which == 13) {
            if($("#keyword").val().trim().length > 0) {
                loading();
                search($("#keyword").val());

                $(".btn-trending").removeClass("active");
                $(".content-area").hide();
            }
        }
    });
    $(".btn-search").click(function (e) { 
        e.preventDefault();
        if($("#keyword").val().trim().length > 0) {
            loading();
            search($("#keyword").val());

            $(".btn-trending").removeClass("active");
            $(".content-area").hide();
        }
    });
    $(".btn-trending").click(function (e) { 
        e.preventDefault();
        loading();

        getTrending();
        $(".btn-trending").addClass("active");
        $(".content-area").hide();
    });

    function search(keyword) {
        try {
            $.get("https://www.googleapis.com/youtube/v3/search", {
                    part: 'snippet,id',
                    q: keyword,
                    maxResults: 50,
                    type: 'video',
                    key: apiKey
                },
                function(data) {
                    // xoa list hien tai
                    $('#result-search').empty();;
    
                    // chay list da search
                    data.items.map(val => {
                        $(`
                            ${getResults(val)}
                        `).appendTo("#result-search");
                    })
    
                    // bat su kien add video
                    $(".add").click(function(){
                        // lay index item duoc chon
                        let index = $(this).parent().index();
                        // them video da chon de phat
                        addVideoToPlay(data.items[index]);
                        // xoa item duoc chon ra khoi list search
                        $(this).parent().remove();
                        // loai bo phan tu ra khoi data
                        data.items.splice(index, 1);
                    })
    
                }
            );
            
        } catch (error) {           
            alert('Lỗi get API từ apiKey !!!');
        }
    }

    function getTrending() {
        try {
            $.get("https://www.googleapis.com/youtube/v3/videos", {
            part: 'snippet,id',
            chart: 'mostPopular',
            regionCode: regionCd,
            kind: 'youtube#video',
            maxResults: 50,
            type: 'video',
            key: apiKey
            },
            function(data) {
                // xoa list hien tai
                $('#result-search').empty();;

                // chay list da search
                data.items.map(item => {
                    $(`
                        ${getResults(item)}
                    `).appendTo("#result-search");
                })

                // bat su kien add video
                $(".add").click(function(){
                    // lay index item duoc chon
                    let index = $(this).parent().index();
                    // them video da chon de phat
                    addVideoToPlay(data.items[index]);
                    // xoa item duoc chon ra khoi list search
                    $(this).parent().remove();
                    // loai bo phan tu ra khoi data
                    data.items.splice(index, 1);
                })
            }
        );
            
        } catch (error) {
            alert('Lỗi get API từ apiKey !!!');
        }
    }

    // fuction ket qua tim kiem
    function getResults(item) {
        let videoID = typeof item.id == "object" ? item.id.videoId : item.id;
        let title = item.snippet.title;
        let thumb = item.snippet.thumbnails.high.url;
        let channelTitle = item.snippet.channelTitle;
        let output = 
            "<div class='item-video'>" +
                "<img class='thumb' src='" + thumb + "'>" +
                "<div>" +
                    "<p class='title'>" + title + "</p>" +
                    "<p class='channelTitle'>" + channelTitle + "</p>" +
                "</div>" +
                "<button class='add' >Add</button>" +
            "</div>";
        return output;
    }

    function addVideoToPlay(item) {

        let videoID = typeof item.id == "object" ? item.id.videoId : item.id;
        let title = item.snippet.title;
        let thumb = item.snippet.thumbnails.high.url;
        let channelTitle = item.snippet.channelTitle;

        if (isPlay == false) {
            isPlay = true;
            localStorage.clear();
            localStorage.setItem("LOCAL", "[]");
            
            play(videoID);
            $(".player-video").fadeIn(2000);

        }
        else {
            $("#title-queue").text("Play list")

            // them video vao list
            let url = "https://www.googleapis.com/youtube/v3/videos?id=" + videoID + "&key=" + apiKey + "&part=snippet,contentDetails";
            $.ajax({
                async: false,
                type: 'GET',
                url: url,
                success: function(data) {
                    if (data.items.length > 0) {
                        addVideoToQueue(videoID, title, thumb, channelTitle);
                    }
                }
            });
        }
    }

    function addVideoToQueue(videoID, title, thumb, channelTitle) {
        let output = 
            "<div class='item-video item-queue'>" +
                "<img class='thumb' src='" + thumb + "'>" +
                "<div>" +
                    "<p class='title'>" + title + "</p>" +
                    "<p class='channelTitle'>" + channelTitle + "</p>" +
                "</div>" +
                "<button class='play' id= '" + videoID + "'>Play</button>" +
                "<button class='remove' id = 'rm-" + videoID + "'>Remove</button>" + 
            "</div>";

        $('#queue-play').append(output);

        // goi su kien play trong list
        $("#" + videoID).click(function () {
            let index = $(this).parent().index();

            play(videoID);
            deleteVideoForLocalStorage(videoID, index);
            deteleVideoForQueue(videoID);
        })

        // goi su kien xoa video trong list
        $("#rm-" + videoID).click(function () {
            let index = $(this).parent().index();

            deleteVideoForLocalStorage(videoID, index);
            deteleVideoForQueue(videoID);
        })

        addVideoToLocalStorage(videoID);
    }

    function addVideoToLocalStorage(videoID) {
        let value = localStorage.getItem("LOCAL");
        let queue = JSON.parse(value);

        queue.push(videoID);
        localStorage.setItem("LOCAL", JSON.stringify(queue));
    }

    // ham play video theo id
    function play(videoID) {
        if(player != null){
            player.loadVideoById({
                'videoId': videoID,
                'startSeconds': 0,
                'suggestedQuality': 'large'
            });

        }else{
            player = new YT.Player('video', {
                height: '320',
                width: '640',
                videoId: videoID,
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });         
        }
    }

    function onPlayerReady(event) {
        event.target.playVideo();
    }

    function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.ENDED) {
            nextVideo();
        }
        else if (event.data == YT.PlayerState.PLAYING) {
            $(".playStop").hide();
            $(".pauseVideo").show();
        }
        else {
            $(".playStop").show();
            $(".pauseVideo").hide();
        }
    }

    $(".loopVideo").click(function (e) {
        player.seekTo(0);
    });

    $(".pauseVideo").click(function (e) { 
        e.preventDefault();
        player.pauseVideo();

        $(".playStop").show();
        $(".pauseVideo").hide();
    });
    $(".playStop").click(function (e) { 
        player.playVideo();

        $(".playStop").hide();
        $(".pauseVideo").show();
    });

    $(".nextMusic").click(function (e) { 
        e.preventDefault();
        nextVideo();
    });

    function nextVideo() {
        // tải video theo id danh sách từ bộ nhớ cục bộ và chuyển đổi json thành mảng
        let value = localStorage.getItem("LOCAL");
        let queue = JSON.parse(value);

        // nếu hàng đợi là trống thì rerutn;
        if (queue.length == 0) {
            return;
        }
        if (queue.length == 1) {
            $("#title-queue").empty();
        }

        // lấy id video ở queue đầu tiên và xóa nó khỏi queue
        let videoID = queue.shift();

        // lưu queue trở lại local storage
        localStorage.setItem("LOCAL", JSON.stringify(queue));

        play(videoID);

        deteleVideoForQueue(videoID);
    }

    // xóa videoID khỏi queue tại vị trí index
    function deleteVideoForLocalStorage(videoID, index) {
        let value = localStorage.getItem("LOCAL");
        let queue = JSON.parse(value);

        queue.splice(index, 1);
        localStorage.setItem("LOCAL", JSON.stringify(queue));

        if (queue.length == 0) {
            $("#title-queue").empty();
        }
    }

    $(".dropdown-select").click(function (e) { 
        e.preventDefault();
        $(".dropdown-list").slideToggle(1000);
    });
    $(".regionCode").click(function (e) { 
        e.preventDefault();
        regionCd = $(this).val();
        $(".select").text($(this).text());
        $(".dropdown-list").slideToggle(1000);

        if($(".btn-trending").hasClass("active")) {
            loading();
            getTrending();

        }

    });

    // xóa item video khỏi layout
    function deteleVideoForQueue(videoID) {
        $("#" + videoID).parent().remove();
    }


    if ($('#back-to-top').length) {
        var scrollTrigger = 100, // px
            backToTop = function () {
                var scrollTop = $(window).scrollTop();
                if (scrollTop > scrollTrigger) {
                    $('#back-to-top').addClass('show');
                } else {
                    $('#back-to-top').removeClass('show');
                }
            };
        $(window).on('scroll', function () {
            backToTop();
        });
        $('#back-to-top').on('click', function (e) {
            e.preventDefault();
            $('html,body').animate({
                scrollTop: 0
            }, 500);
        });
    }

});