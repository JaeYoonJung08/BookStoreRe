var express = require('express');
var router = express.Router();
var logger = require('../logger');
// const { router } = require('../app');

/* GET home page. */
router.get('/', function(req, res, next) {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  res.render('index');
});

// ------------ login ------------------
//사용자 로그인 페에지
router.get('/user',  async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  res.render('login');
})


//사용자 로그인 기능
router.post('/signin', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {userName, userPassword }= req.body
  try{
    const check = await req.db.query(
      'select * from user where password = ? and name = ?'
      ,[userPassword, userName]
    );

    if (check.length > 0)
    {
      console.log("사용자 있음 ");
      console.log(check)
      const user_id = check[0].user_id

      const checkbasketId = await req.db.query(
        'select * from bookbasket where user_id = ?'
        ,[user_id]
      )

      // console.log(checkbasketId.basket_id)
      req.session.user_id = user_id
      req.session.userName = userName
      req.session.basket_id = checkbasketId[0].basket_id
      console.log("req.session.user_id : " + req.session.user_id)
      console.log("req.session.userName : " +req.session.userName)
      console.log("req.session.bookbasket : " +req.session.basket_id)
      return res.send(
        `<script type="text/javascript">
        alert("로그은이 성공적으로 수행되었습니다.");
        location.href='/';
        </script>`
      );
    }
    else 
    {
      return res.send(
        `<script type="text/javascript">
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
        location.href='/user';
        </script>`
      );
    }
  }
  catch(error){
    console.log(error)
  }
})

// 회원가입
router.post('/signup', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {userName, userPassword} = req.body;
  try
  {
    const check = await req.db.query(
      'select * from user where password = ? and name = ?',
      [userPassword, userName]
    );
    console.log(check)
    
    if (check.length > 0)
    {
      return res.send(
        `<script type="text/javascript">
        alert("이미 존재하는 아이디와 비밀번호입니다.");
        location.href='/user';
        </script>`
      );
    }
    else 
    {
      //회원가입 시키기
      const insertuser = await req.db.query(
        'insert into user(password,name) values(?, ?)',
        [userPassword, userName]
      )
      //장바구니 만들기
      const createbasket = await req.db.query(
        'insert into bookbasket(user_id) values(?)',
        [insertuser.insertId]
      )
      
      console.log(insertuser);
      return res.send(
        `<script type="text/javascript">
        alert("회원가입이 완료되었습니다. 다시 로그인을 진행해주세요.");
        location.href='/user';
        </script>`
      );
    }
  }catch(error)
  {
    console.log(error)
  }
})

// ------------ cardAddr ------------------
// 카드, 주소 페이지
router.get('/cardAddr', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  if (req.session.user_id > 0)
  {
    res.render('cardAddr');
  }
  else 
  {
    return res.send(
      `<script type="text/javascript">
      alert("로그인을 먼저 진행해주세요.");
      location.href='/user';
      </script>`
    );
  }
 
})

//카드 추가
router.post('/cardAddr/createcard', async (req,res)=> {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {cardNumber, cardExpriation, cardtype} = req.body;
  // console.log(cardNumber)
  // console.log(cardExpriation)
  // console.log(cardtype)
  try {
    const check = await req.db.query(
      'select * from card where card_number = ? and user_id = ?',
      [cardNumber, req.session.user_id]
    )
    if (check.length > 0)
    {
      return res.send(
        `<script type="text/javascript">
        alert("이미 존재하는 카드입니다.");
        location.href='/cardAddr';
        </script>`
      );
    }
    else 
    {
      const insertcard = await req.db.query(
        'insert into card(user_id, card_number, type_card, expriation_time) values (?,?,?,?)',
        [req.session.user_id, cardNumber, cardtype, cardExpriation]
      )
      return res.send(
        `<script type="text/javascript">
        alert("카드 입력이 완료되었습니다");
        location.href='/';
        </script>`
      );
    }
  }
  catch(error)
  {
    console.log(error)
  }
})

//주소 추가
router.post('/cardAddr/createaddr', async (req,res)=> {
  const {userbasicAdd, userdetailAdd, userPostal} = req.body
  try
  {
    const check = await req.db.query(
      'select * from addr where postal_code = ? and user_id = ?',
      [userPostal, req.session.user_id]
    )

    if (check.length > 0)
    {
      return res.send(
        `<script type="text/javascript">
        alert("이미 등록된 주소입니다.");
        location.href='/';
        </script>`
      );
    }
    else
    {
      await req.db.query(
        'insert into addr(user_id, postal_code, basic_add, detail_add) values (?,?,?,?)'
        ,[req.session.user_id, userPostal, userbasicAdd, userdetailAdd]
      )
      return res.send(
        `<script type="text/javascript">
        alert("주소가 등록 되었입니다.");
        location.href='/';
        </script>`
      );
    }
  }
  catch(error)
  {
    console.log(error)
  }
})

// 카드, 주소 전체 조화 
// /cardAddr/all
router.get('/cardAddr/all', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  try
  {
      //카드 주소 조회 
      const card = await req.db.query(
          'select * from card where user_id = ?',
          [req.session.user_id]
      )
      const addr = await req.db.query(
          'select * from addr where user_id = ?',
          [req.session.user_id]
      )
      res.render('cardAddrAll', {card:card, addr:addr});

  }
  catch (error)
  {
      console.log(error);
      return res.send(
          `<script type="text/javascript">
          alert("데이터베이스 오류입니다.");
          location.href='/cardAddr';
          </script>`)
  }
})

//  ------------------------ booklist ------------------------------
// booklist 책 조회
router.get('/booklist', async (req,res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const books = await req.db.query('SELECT * FROM booklist;');
  console.log("현재 판매 중인 책 : ", books);
  res.render('booklist', {books:books});
})

//booklist 책 추가
router.post('/booklist/bookAdd', async (req, res) => {
  const {bookName, bookCount, bookPrice} = req.body;
  if (bookName.length === 0 || parseInt(bookCount) <= 0 || parseInt(bookPrice) <= 0)
  {
    return res.send(
      `<script type="text/javascript">
      alert("입력을 다시 해주세요");
      location.href='/booklist';
      </script>`)
  }
  try
  {
    const checkbook = await req.db.query(
      'select * from booklist where book_name = ?',
      [bookName]
    )
    //책이 있을 경우 
    if (checkbook.length === 0)
    {
      await req.db.query(
        'insert into booklist(book_name, book_count, book_price) values(?,?,?)',
        [bookName, parseInt(bookCount), parseInt(bookPrice)]
      )
      return res.send(
        `<script type="text/javascript">
        alert("책이 추가 되었습니다.");
        location.href='/booklist';
        </script>`)
    }
    else 
    {
      //책이 있으면 Count 그만큼 추가해주기
      const sumCount = checkbook[0].book_count;
      var book_id = checkbook[0].book_id;
      var sum = parseInt(sumCount) + parseInt(bookCount);
      console.log("bookcCount : ", sum);
      const InsertSQL = await req.db.query(
          'update booklist set book_count = ? where book_id = ?',
          [sum, book_id]
      )
      return res.send(
          `<script type="text/javascript">
          alert("책의 수량이 추가 되었습니다.");
          location.href='/booklist';
          </script>`
      );
    }
  }
  catch(error)
  {
    console.log(error)
  }
})

// ----------------- booklist 상세보기 --------------------------
router.get('/booklist/:book_number', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const booknumber = req.params.book_number;
  console.log(booknumber)
  try{
      const Read = await req.db.query(
          'select * from booklist where book_id = ?',
          [booknumber]
      );

      console.log(Read);
      res.render('bookdetail', {book : Read[0]});
  }
  catch (error){
      console.log(error);
  }
})

//booklist/basketAdd 책 장바구니에 담기
// book_id와 book_count는 이미 조회된 pug에서 가져오는 거임.
router.post('/booklist/basketAdd', async (req,res) => {
  if (!req.session.user_id)
  {
    return res.send(
      `<script type="text/javascript">
      alert("로그인을 먼저 진행해주세요");
      location.href='/booklist';
      </script>`
    );
  }

  //주문할 수량이 더 많을 경우 처리
  const {book_id, book_count, book_pharse_count} = req.body
  if (parseInt(book_pharse_count) > parseInt(book_count))
  {
    return res.send(
      `<script type="text/javascript">
      alert("장바구니에 담을 수량이 기본 수량 보다 많습니다.");
      location.href='/booklist';
      </script>`
    );
  }

  try 
  {
    await req.db.query(
      'insert into basketlist(basket_id, book_id, book_count) values (?,?,?)'
      ,[parseInt(req.session.basket_id), parseInt(book_id), parseInt(book_pharse_count)]
    )
    return res.send(
      `<script type="text/javascript">
      alert("장바구니에 추가 하였습니다.");
      location.href='/booklist';
      </script>`
    );

  }
  catch(error)
  {
    console.log(error)
  }




})






module.exports = router;
