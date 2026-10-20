const empty = () => ({});

module.exports = {
  settings: {
    siteName: "台北市綠能協會",
    englishName: "TAIPEI GREEN ENERGY ASSOCIATION",
    logo: "images/logo.png",
    phone: "+886 2 2718 1688",
    email: "tge-service@gmail.com",
    address: "台北市萬華區和平西路三段70號2樓",
    addressEn: "2F., No.70, Sec. 3, Heping W. Rd., Wanhua Dist., Taipei City 108020, Taiwan (R.O.C.)",
    copyright: "Copyright © 臺北市綠能協會 All Rights Reserved.",
    facebook: "#",
    instagram: "#",
    mapQuery: "台北市萬華區和平西路三段70號"
  },
  newsCategories: [
    { id: "announce", name: "協會公告" },
    { id: "event", name: "活動訊息" },
    { id: "media", name: "媒體報導" }
  ],
  pages: [
    {
      id: "index",
      slug: "index",
      title: "封面",
      navLabel: "封面",
      en: "",
      showInNav: false,
      parentId: "",
      layout: "cover",
      titleStyle: empty(),
      blocks: [
        {
          id: "cover",
          type: "cover",
          style: empty(),
          data: {
            background: "images/cover-desktop.png",
            backgroundMobile: "images/cover-mobile.png",
            buttonText: "進入主頁",
            buttonHref: "about.html",
            title: "台北市綠能協會",
            subtitle: "TAIPEI GREEN ENERGY ASSOCIATION",
            copyright: "Copyright © 2025"
          }
        }
      ]
    },
    {
      id: "about",
      slug: "about",
      title: "認識本會",
      navLabel: "認識本會",
      en: "About TGNA",
      showInNav: true,
      parentId: "",
      layout: "inner",
      titleStyle: empty(),
      blocks: [
        { id: "a1", type: "heading", style: empty(), data: { text: "緣起" } },
        { id: "a2", type: "text", style: empty(), data: { text: "全球暖化氣溫上升引發的極端氣候，造成世界各地災情不斷與龐大的經濟損失，降低碳排放量已刻不容緩，也是全球各國共同面對的課題。而發展與推廣綠色能源以及研發創造新能源，是目前需要解決的目標。\n\n【臺北市綠能協會】是一個全國性的非營利事業組織（NPO），以提升綠能發展的認知觀念、推動低碳排放、創造永續環境，並結合產官學專家爭取公共政策參與，為台灣下一代貢獻力量。\n\n本會結合國內綠電發展相關領域企業以及學術研究機構之專業人員，提供政府綠電能源政策建言，促進國內綠能應用與技術服務。並不定期舉辦綠電發展與 ESG 永續系列講座，與國內外產業專家一起探討綠色能源永續發展的核心價值。" } },
        { id: "a3", type: "heading", style: empty(), data: { text: "任務 / Mission" } },
        { id: "a4", type: "image", style: empty(), data: { src: "images/about.jpg", alt: "本會任務", shape: "normal" } },
        { id: "a5", type: "text", style: empty(), data: { text: "（一）研議綠能發電產業推廣策略，以提供政府施政及產業界發展參考。\n（二）結合產學研發技術推動綠色能源發展，促進國際交流。\n（三）建立綠色能源與企業永續資訊服務平台。\n（四）參與政府部會產業技術認證測試制度之推動。\n（五）辦理國內外參訪考察研習活動之規劃執行。\n（六）農漁光電、土地併聯、環評等法規內容交流溝通。\n（七）增進社會大眾對綠色能源發電科技及環境生態的認識與應用。\n（八）其他綠能相關學術研究之產官學綜合研習推廣業務辦理。" } },
        { id: "a6", type: "heading", style: empty(), data: { text: "合作單位 / Cooperative unit" } },
        { id: "a7", type: "logos", style: empty(), data: { items: [
          { src: "images/team1.jpg", name: "太陽光電能源科技股份有限公司\nBIG SUN GROUP" },
          { src: "images/team2.jpg", name: "地熱發電合作" },
          { src: "images/team3.jpg", name: "StartUs Insights" },
          { src: "images/team4.jpg", name: "台灣太陽光電產業協會" }
        ] } }
      ]
    },
    {
      id: "charter",
      slug: "charter",
      title: "協會組織章程",
      navLabel: "協會組織章程",
      en: "ORG Articles",
      showInNav: true,
      parentId: "about",
      layout: "inner",
      titleStyle: empty(),
      blocks: [
        { id: "c1", type: "paper", style: empty(), data: { banner: "協會組織章程", body: "第一章、總則\n\n第一條、本會名稱為台北市綠能協會，以下簡稱為本會，英文為 TAIPEI GREEN ENERGY ASSOCIATION，簡稱 TGEA。\n\n第二條、本會為依據人民團體法設立之社會團體，非以營利為目的。\n\n第三條、本會以發展綠能教育、提升節能減碳、倡導綠色體驗、推廣地球義工為宗旨。\n\n第四條、本會以台北市行政區域為組織區域。\n\n第五條、本會會址設於台北市萬華區和平西路三段70號2樓。\n\n第六條、本會任務如下：\n一、協助政府機關辦理節能減碳政策之宣導活動。\n二、結合民間企業宣傳節能減碳與環境保護之重要性。\n三、定期舉辦或協助邀請辦理綠色能源之文藝性、公益性活動。\n四、推廣防止地球暖化各項減碳使用之認知。\n五、協助國內綠色產業建立品牌形象、開創商機。\n六、配合政府推廣節能減碳政策，促進產官學交流活動。\n七、協助提升綠能活動，以循環碳經濟幫助企業邁向新里程碑。\n\n第二章、會員\n\n第七條、本會會員分為下列三種：\n一、個人會員：凡贊同本會宗旨、年滿二十歲、設籍居住台北市或於台北市工作，填具入會申請書，經理事會通過並繳納會費後為個人會員。\n二、團體會員：凡於台北市登記有案、贊同本會宗旨之機構或團體，填具入會申請書，經理事會通過並繳納會費後為團體會員。團體會員得派代表行使會員權利。\n三、贊助會員：凡認同本會宗旨並對會務推廣有助益者，經理事會通過並繳交會費後為贊助會員。學生得依規定以學生會員入會。\n\n第八條、會員或會員代表有違法令、章程或不遵守會員大會決議時，得經理事會決議予以警告或停權；其危害團體情節重大者，得經會員大會決議予以除名。\n\n第九條、會員有下列情形之一者，已繳納之各項會費不予退還：一、喪失會員資格者。二、經會員大會決議除名者。\n\n第十條、會員享有表決權、選舉權、被選舉權與罷免權。未繳納當年常年會費而被停權者，不具上述權利。\n\n第十一條、會員有遵守本會章程、決議及繳納會費之義務。\n\n第十二條、會員得以書面具名理由向本會申請退會，並於會計年度結束時生效，已繳納之各項費用不予退還。\n\n第三章、組織與職權\n\n第十三條、本會以會員大會為最高權力機構，理事會為執行機構，監事會為監察機構。\n\n第十四條、會員大會職權包括訂定與變更章程、選舉及罷免理監事、決議會費及捐款、決議年度工作計畫與預算決算，以及其他與會員權利義務有關之重大事項。\n\n第十五條、本會置理事、監事，由會員選舉之，分別成立理事會、監事會，並置候補理監事，遇缺時依序遞補。\n\n第十六條、理事會職權包括審定會員資格、選舉及罷免常務理事與理事長、聘免工作人員、擬定年度工作計畫及預算決算，以及其他應執行事項。\n\n第十七條、理事會置常務理事，並由常務理事互選一人為理事長。理事長對內綜理會務，對外代表本會。\n\n第十八條、監事會監察理事會工作之執行、審核年度決算，並選舉常務監事。\n\n第十九條至第二十七條、理監事均為無給職，任期、解任、工作人員設置、委員會及名譽職，依本章程及主管機關相關規定辦理。\n\n第四章、會議\n\n第二十八條、會員大會分定期會議與臨時會議，由理事長召集。定期會議每年召開一次。\n\n第二十九條、會員不能出席會員大會時，得以書面委託其他會員代理，每一會員以代理一人為限。\n\n第三十條、會員大會之決議，以會員過半數之出席、出席人數過半數之同意行之。章程變更、會員除名、理監事罷免、財產處分及本會解散等事項，以出席人數三分之二以上同意行之。\n\n第三十一條至第三十三條、理事會、監事會定期召開，會議通知、出缺席及紀錄報備，依本章程辦理。\n\n第五章、經費及會計\n\n第三十四條、本會經費來源包括入會費、常年會費、會員捐款、委託收益、基金孳息及其他收入。\n\n第三十五條、本會會計年度自每年一月一日起至十二月三十一日止。\n\n第三十六條、本會於會計年度開始前編造工作計畫及預算，於年度終了後編造工作報告及決算，提會員大會通過後報主管機關核備。\n\n第三十七條、本會解散後，剩餘財產歸屬所在地之地方自治團體或主管機關指定之機關團體。\n\n第六章、附則\n\n第三十八條、本章程未規定事項，悉依有關法令規定辦理。\n\n第三十九條、本會辦事細則由理事會訂定之。\n\n第四十條、本章程經會員大會通過，報主管機關核備後施行，修正時亦同。" } }
      ]
    },
    {
      id: "chairman",
      slug: "chairman",
      title: "現任理事長",
      navLabel: "現任理事長",
      en: "",
      showInNav: true,
      parentId: "about",
      layout: "panel",
      titleStyle: empty(),
      blocks: [
        { id: "h1", type: "image", style: empty(), data: { src: "images/chairman.jpg", alt: "理事長 高琦", shape: "circle" } },
        { id: "h2", type: "heading", style: empty(), data: { text: "現任" } },
        { id: "h3", type: "text", style: empty(), data: { text: "臺北市綠能協會 理事長\n台灣女企業家協會 榮譽理事長\n中華羅梁文化藝術協會 副主席" } },
        { id: "h4", type: "heading", style: empty(), data: { text: "現 / 經歷" } },
        { id: "h5", type: "text", style: empty(), data: { text: "墨玉資本股份有限公司 副董事長\n紫龍投資控股有限公司 董事長\n觀享人文有限公司 董事長" } },
        { id: "h6", type: "heading", style: empty(), data: { text: "理事長的話" } },
        { id: "h7", type: "text", style: empty(), data: { text: "當你心中有夢想，即使閉上雙眼一樣看得到遠景。\n我們團隊秉持優良傳統「盡全力就是！」\n\n推動綠能產業發展，用科技創新，實踐綠色經濟，與全世界接軌。我們交一輩子愛地球的好朋友。為後代留下美好地球！\n\n為了永續的環境，「臺北市綠能協會」之所以成立的一個重要原因，是喚醒大眾的淨零排放意識。協會由企業、學術單位所組成，並訂立政策擬定、循環經濟、智慧綠能的目標，期盼能為台灣的低碳綠色能源盡一份心力。\n\n祝福本會會務昌隆，諸位會員先進平安如意。\n\n理事長 高琦 敬上" } }
      ]
    },
    {
      id: "service",
      slug: "service",
      title: "服務項目",
      navLabel: "服務項目",
      en: "Service",
      showInNav: true,
      parentId: "",
      layout: "inner",
      titleStyle: empty(),
      blocks: [
        { id: "s1", type: "slider", style: empty(), data: { images: [
          { src: "images/service1.jpg", alt: "" },
          { src: "images/service2.jpg", alt: "" },
          { src: "images/service3.jpg", alt: "" },
          { src: "images/service4.jpg", alt: "" },
          { src: "images/service5.jpg", alt: "" }
        ] } },
        { id: "s2", type: "cards", style: empty(), data: { items: [
          { title: "政策建言", text: "研議綠能發電產業推廣策略，提供政府施政及產業界發展參考。" },
          { title: "產學交流", text: "結合產學研發技術，推動綠色能源發展並促進國際交流。" },
          { title: "資訊平台", text: "建立綠色能源與企業永續資訊服務平台。" },
          { title: "技術認證", text: "參與政府部會產業技術認證測試制度之推動。" },
          { title: "參訪研習", text: "辦理國內外參訪、考察與研習活動。" },
          { title: "法規溝通", text: "農漁光電、土地併聯、環評等法規內容交流。" },
          { title: "公眾教育", text: "增進社會大眾對綠能科技及環境生態的認識與應用。" },
          { title: "講座推廣", text: "辦理綠能與 ESG 永續系列講座及產官學研習。" }
        ] } }
      ]
    },
    {
      id: "news",
      slug: "news",
      title: "最新消息",
      navLabel: "最新消息",
      en: "News",
      showInNav: true,
      parentId: "",
      layout: "inner",
      titleStyle: empty(),
      blocks: [{ id: "nlist", type: "news-list", style: empty(), data: {} }]
    },
    {
      id: "events",
      slug: "events",
      title: "活動花絮",
      navLabel: "活動花絮",
      en: "Event Photos",
      showInNav: true,
      parentId: "",
      layout: "inner",
      titleStyle: empty(),
      blocks: [{ id: "alist", type: "album-list", style: empty(), data: {} }]
    },
    {
      id: "partners",
      slug: "partners",
      title: "全球夥伴",
      navLabel: "全球夥伴",
      en: "Global Partners",
      showInNav: true,
      parentId: "",
      layout: "inner",
      titleStyle: empty(),
      blocks: [
        { id: "p1", type: "logos", style: empty(), data: { items: [
          { src: "images/team1.jpg", name: "太陽光電能源科技股份有限公司\nBIG SUN GROUP" },
          { src: "images/team2.jpg", name: "地熱發電合作" },
          { src: "images/team3.jpg", name: "StartUs Insights" },
          { src: "images/team4.jpg", name: "台灣太陽光電產業協會" }
        ] } }
      ]
    },
    {
      id: "contact",
      slug: "contact",
      title: "聯絡我們",
      navLabel: "聯絡我們",
      en: "Contact us",
      showInNav: true,
      parentId: "",
      layout: "inner",
      titleStyle: empty(),
      blocks: [
        { id: "k1", type: "contact", style: empty(), data: { asideTitle: "台北市綠能協會", aside: "聯絡人：副理事長　陳凱程\n聯絡電話：0935-068-717\n\n聯絡人：副秘書長　Jeff\n聯絡電話：0922-586-386\n\n聯絡人：會務　Eason\n聯絡電話：0970-229-119\n\n會址：台北市萬華區和平西路三段70號2樓\n電話：+886 2 2718 1688\n信箱：tge-service@gmail.com" } },
        { id: "k2", type: "map", style: empty(), data: { query: "台北市萬華區和平西路三段70號" } }
      ]
    }
  ],
  news: [
    { id: "n1", category: "announce", date: "2025/10/15", image: "images/news-green.jpg", title: "降低綠電取得門檻，為台灣企業鋪設通往淨零轉型的實踐路徑", summary: "經濟部標準檢驗局與台電推出「小額綠電銷售計畫」，協助中小企業透過公開競價取得綠電。", body: "在全球淨零排放的目標下，綠電交易逐漸成為企業永續轉型的關鍵一環。為協助中小企業取得綠電、參與減碳行動，經濟部標準檢驗局與台電攜手推出「小額綠電銷售計畫」。\n\n透過公開透明的競價平台，降低綠電取得門檻，為台灣企業鋪設通往淨零轉型的實踐路徑。臺北市綠能協會將持續整理相關政策與實務資訊，協助會員理解如何參與。" },
    { id: "n2", category: "event", date: "2026/04/11", image: "images/news-netzero.jpg", title: "新北市淨零公正轉型成果交流會｜即將登場", summary: "面對碳關稅、供應鏈壓力與淨零轉型，這是企業現在就要面對的課題。", body: "你準備好面對碳關稅、供應鏈壓力與淨零轉型了嗎？這不只是趨勢，而是企業現在就要做的課題。\n\n新北市淨零公正轉型成果交流會即將登場。臺北市綠能協會邀請關心綠色轉型的企業與夥伴一同參與，交流淨零路徑與實務成果。" },
    { id: "n3", category: "event", date: "2025/10/24", image: "images/news-ssbti.jpg", title: "台北綠能協會與 SSBTi 攜手，對接全球通路永續標準", summary: "少走彎路，直通國際指引。國際品牌已將 EPD、LCA、CDP 納入供應鏈要求。", body: "台北綠能協會理事長高琦表示，在 ESG 與淨零轉型的浪潮下，國際品牌與零售通路，以及國際平台，都已將環境產品宣告（EPD）、生命週期評估（LCA）、碳揭露（CDP）納入供應鏈管理的核心要求。\n\n這些標準不只是企業責任，也是進入全球市場的通行證。協會與 SSBTi 攜手，希望協助會員少走彎路，對接國際永續指引。" },
    { id: "n4", category: "media", date: "2024/10/23", image: "images/news-renew.jpg", title: "國際再生能源發展趨勢與政策", summary: "能源自主是能源安全的重要指標。我國能源多仰賴進口，發展自主能源刻不容緩。", body: "能源自主是一國能源安全的重要指標。我國天然資源有限，能源多仰賴國外進口，發展自主能源刻不容緩。\n\n隨著全球共同遏阻暖化成為趨勢，再生能源政策與國際發展動向，也是臺灣推動綠色能源時必須對接的方向。" },
    { id: "n5", category: "media", date: "2024/10/08", image: "images/news-cpc.jpg", title: "打造台灣中油智慧綠能加油站", summary: "整合型社區綠色能源供應中心，配合綠色成長與節能減碳政策尋求業務轉型。", body: "配合全球綠色成長趨勢，以及政府各項鼓勵綠能開發與節能減碳政策，台灣中油公司持續尋求業務轉型，以注入新的成長動力。\n\n智慧綠能加油站以整合型社區綠色能源供應中心為方向，把加油服務與綠能設施放在同一個生活節點。" },
    { id: "n6", category: "media", date: "2022/01/26", image: "images/news-fish.jpg", title: "能源轉型戰漁電共生", summary: "以現有養殖漁業為基礎，結合太陽光電，同時維持養殖生產與潔淨能源。", body: "漁電共生是一種太陽能光電形式，以土地複合利用為主軸。\n\n它以現有養殖漁業為基礎，有條件結合太陽光電發電設施，既可維持養殖生產，同時又達成潔淨能源的目的。" }
  ],
  albums: [
    { id: "a1", category: "event", title: "114年3月30日姜太公道場桐花季開鑼儀式", summary: "姜太公道場桐花季開鑼儀式", cover: "images/album1.jpg", photos: [{ id: "a1p1", src: "images/album1.jpg", caption: "開鑼儀式" }] },
    { id: "a2", category: "event", title: "114年4月30日白沙屯媽祖善行天下活動", summary: "白沙屯媽祖善行天下活動", cover: "images/album2.jpg", photos: [{ id: "a2p1", src: "images/album2.jpg", caption: "活動現場" }] },
    { id: "a3", category: "talk", title: "114年5月8日淨零永續ESG整體解決方案", summary: "南港展覽館淨零永續ESG整體解決方案", cover: "images/album3.jpg", photos: [{ id: "a3p1", src: "images/album3.jpg", caption: "論壇現場" }] },
    { id: "a4", category: "affairs", title: "114年6月10日長官指導", summary: "歡迎長官到台北市綠能協會指導", cover: "images/album4.jpg", photos: [{ id: "a4p1", src: "images/album4.jpg", caption: "會務指導" }] },
    { id: "a5", category: "event", title: "114年快樂聯播網30週年活動", summary: "快樂聯播網30週年活動", cover: "images/album5.jpg", photos: [{ id: "a5p1", src: "images/album5.jpg", caption: "30週年活動" }] },
    { id: "a6", category: "event", title: "114年8月2日南港展覽館二館小樹傳愛", summary: "環球境地 × 台北市綠能協會聯合展覽", cover: "images/album6.jpg", photos: [{ id: "a6p1", src: "images/album6.jpg", caption: "聯合展覽" }] }
  ]
};
