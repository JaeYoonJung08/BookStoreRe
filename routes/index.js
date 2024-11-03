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
        alert("로그인이 성공적으로 수행되었습니다.");
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
        alert("주소가 등록 되었습니다.");
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
// 책 상세 보기, 도서 상세
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
  logger.info(`Request received for URL: ${req.originalUrl}`);
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

// ----------------- 장바구니 보기 bookbasket -------------
// 장바구니 화면 띄우기
router.get('/bookbasket', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  if (!req.session.user_id)
  {
    return res.send(
      `<script type="text/javascript">
      alert("로그인을 먼저 진행해주세요");
      location.href='/';
      </script>`
    );
  }
  try
  {
      const bookbasketlist = await req.db.query(
        'select * from basketlist where basket_id = ?',
        [req.session.basket_id]
    )    
      // 장바구니에 책이 있는 경우
      if (bookbasketlist.length > 0) {
          // req.session.basket_id = bookbasketlist[0].basket_id;

          // 장바구니에 담긴 모든 book_id를 배열로 만듦
          const bookIds = bookbasketlist.map(item => item.book_id);
          console.log(bookIds);
          // book_id에 해당하는 책 정보를 booklist 테이블에서 조회
          const books = await req.db.query(
              'SELECT * FROM booklist WHERE book_id IN (?)',
              [bookIds]
          );

          console.log("books : " , books);
          return res.render('bookbasket', { books, bookbasketlist });
      }
      else 
      {
          return res.render('bookbasket', { books: [], bookbasketlist: [] });
      }
  }
  catch(error)
  {
      console.log(error);
  }
})

//장바구니에서 수량 변경하기, 변경 쿼리
router.post('/bookbakset/change', async (req,res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {book_id, book_count} = req.body
  console.log(book_id, book_count)

  try
  {
    //여기서 장바구니 수량이 기본 보다 많으면 안 됨
    const check = await req.db.query(
      'select book_count from booklist where book_id = ?'
      ,[parseInt(book_id)]
    )
    console.log(check[0].book_count)
    if (parseInt(check[0].book_count) < parseInt(book_count))
    {
      return res.send(
        `<script type="text/javascript">
        alert("장바구니 수량이 도서의 수량 보다 많습니다.");
        location.href='/bookbasket';
        </script>`
      );
    }

    //book_count가 변경된 수량임
    //basketlist tabled에서 book_count를 변경시켜주어야함.
    await req.db.query(
      'update basketlist set book_count = ? where basket_id = ? and book_id = ?'
      ,[parseInt(book_count), req.session.basket_id ,book_id]
    ) 

    return res.send(
      `<script type="text/javascript">
      alert("수량이 변경되었습니다");
      location.href='/bookbasket';
      </script>`
    );
  }
  catch(error)
  {
    console.log(error);
  }
})

//장바구니에서 목록 삭제
router.post('/bookbasket/delete', async (req, res)=> {
  const {book_id} = req.body
  try
  {
    req.db.query(
      'DELETE FROM basketlist WHERE basket_id = ? AND book_id = ?'
      ,[req.session.basket_id, book_id]
    )
    return res.send(
      `<script type="text/javascript">
      alert("삭제되었습니다.");
      location.href='/bookbasket';
      </script>`
    );

  }catch(error)
  {
    console.log(error)
  }
})




// ----------------------------------------------------------- 주문하기 -------------------------------------------------------
// 장바구니에서 주문하기인데 주문하기 버튼을 누르고 난 후임.
// bookbasket.pug에서 all_price인 금액이랑 selectedBooks의 선택된 책을 보내줌
router.post('/orderpage', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {selectedBooks, all_price} = req.body
  console.log("selectedBooks : " + selectedBooks)
  //선택된 책이 없을 때
  if (!selectedBooks) {
      return res.send(
          `<script type="text/javascript">
          alert("주문할 책을 선택해주세요.");
          location.href='/bookbasket';
          </script>`);
  }
  const selectedBookList = Array.isArray(selectedBooks) ? selectedBooks.map(book => JSON.parse(book)) : [JSON.parse(selectedBooks)];

  // console.log("selectedBookList : " + selectedBookList)
  console.log("all_price : " + all_price);
  try
  {
      //기본 배송지, 상세 배송지, 우편 번호
      const UserAddr = await req.db.query(
        'select * from addr where user_id = ?',
        [req.session.user_id]
      )
      //카드번호, 카드 종류, 카드 유효기간 
      const UserCard = await req.db.query(
          'select * from card wherer where user_id = ?',
          [req.session.user_id]
      )

      const point = await req.db.query(
        'select * from user where user_id = ? and stamp >= ?'
        ,[req.session.user_id, 10]
      )

      console.log(point)



      res.render('orderpage', {all_price, UserAddr, UserCard, selectedBookList, point});
  }
  catch(error)
  {
    console.log(error)
    res.send(
      `<script type="text/javascript">
      alert("주문 처리 중 오류가 발생했습니다.");
      location.href='/';
      </script>`);
  }
})

router.post('/buynow/orderpage', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {selectedBooks, all_price, bookstore_bookcount} = req.body
  console.log("selectedBooks : " + selectedBooks)
  console.log("bookstore_bookcount : " + bookstore_bookcount)
  //선택된 책이 없을 때
  if (!selectedBooks) {
      return res.send(
          `<script type="text/javascript">
          alert("주문할 책을 선택해주세요.");
          location.href='/';
          </script>`);
  }
  const selectedBookList = Array.isArray(selectedBooks) ? selectedBooks.map(book => JSON.parse(book)) : [JSON.parse(selectedBooks)];
  
  //책 수량 보다 즉지 주문할 수량 보다 적을 때
  const bookstore_bookcount_num = parseInt(bookstore_bookcount)
  console.log(parseInt(selectedBookList[0].book_count))
  console.log(bookstore_bookcount_num)
  //selectedBookList[0].book_count -> 이게 내가 선택
  // bookstore_bookcount_num 이건 서점에 있는 책
  if (parseInt(selectedBookList[0].book_count) > bookstore_bookcount_num)
  {
    return res.send(
      `<script type="text/javascript">
      alert("즉시 주문할 수량이 책의 기본 수량 보다 많습니다.");
      location.href='/booklist';
      </script>`);
  }
  

  // console.log("selectedBookList : " + selectedBookList)
  console.log("all_price : " + all_price);
  try
  {
      //기본 배송지, 상세 배송지, 우편 번호
      const UserAddr = await req.db.query(
        'select * from addr where user_id = ?',
        [req.session.user_id]
      )
      //카드번호, 카드 종류, 카드 유효기간 
      const UserCard = await req.db.query(
          'select * from card wherer where user_id = ?',
          [req.session.user_id]
      )

      const point = await req.db.query(
        'select point from user where user_id = ? and point >= 1000'
        ,[req.session.user_id]
      )

      res.render('orderpage', {all_price, UserAddr, UserCard, selectedBookLis, point});
  }
  catch(error)
  {
    console.log(error)
    res.send(
      `<script type="text/javascript">
      alert("주문 처리 중 오류가 발생했습니다.");
      location.href='/';
      </script>`);
  }
})

//  이제 주문 목록, 주문 총액, 배송지 정보, 카드 정보 보여주면서 마지막 주문
router.post('/orderpage/add', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  let {totalPrice, selectedCard, selectedAddress, selectedPoint} = req.body;

  let selectedBookList;
  try {
      selectedBookList = JSON.parse(req.body.selectedBookList);
  } catch (e) {
      selectedBookList = req.body.selectedBookList;
  }

  console.log("totalPrice : ", totalPrice);
  console.log("selectedCard : ", selectedCard);
  console.log("selectedAddress : ", selectedAddress);
  console.log("selectedBookList : ", selectedBookList);

  try{
      //주문시킨 책 만큼 책 개수 감소 //반복문!!!!!!!!!!!!!!!!!!!
      const bookCounts = selectedBookList.map(book => book.book_count);
      for (let book of selectedBookList) {
          const { book_id, book_count } = book;
          const rows = await req.db.query('SELECT book_count FROM booklist WHERE book_id = ?', [book_id]);
          const currentCount = rows[0].book_count;

          // Calculate the new book count
          const newCount = parseInt(currentCount) - parseInt(book_count);

          // Update the book count in the database
          await req.db.query('UPDATE booklist SET book_count = ? WHERE book_id = ?', [newCount, book_id]);
      }

      //사용자 주소
      const valueAddr = await req.db.query(
          'select basic_add, detail_add, postal_code from addr where addr_id = ?', 
          [selectedAddress]
      )

      //사용자 카드
      const valueCard = await req.db.query(
          'select card_number, type_card, expriation_time from card where card_id = ?', 
          [selectedCard]
      )
      const { basic_add, detail_add, postal_code } = valueAddr[0];
      const { card_number, type_card, expriation_time } = valueCard[0];
      
      //적립금 빼기
      console.log(selectedPoint)
      let order_point = 0;
      if (selectedPoint)
      {
        order_point = totalPrice - parseInt(selectedPoint);
      }
      else 
      {
        selectedPoint = null;
      }
      //order 테이블에 값 넣기
      const insertOrderQuery = `
      INSERT INTO orders (
          user_id, all_price, basic_add, detail_add, postal_code, card_number, type_card, expriation_time, order_save_point, order_point, order_point_save_date, order_story, order_point_use_date, order_use_story 
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,? ,?,?,?)`;

      //회원 point 적립
      const check = await req.db.query(
        'select * from user where user_id = ?'
        ,[req.session.user_id]
      )

      let basic_point = check[0].point
      let point = parseInt(totalPrice) - parseInt(parseInt(selectedPoint));
      point = point / 10
      await req.db.query(
        'UPDATE user SET point = ? WHERE user_id = ?',
        [point + parseInt(basic_point), req.session.user_id]
      )


      
      const result = await req.db.query(insertOrderQuery, [
          req.session.user_id, totalPrice, basic_add, detail_add, postal_code, card_number, type_card, expriation_time, point, parseInt(selectedPoint), '2024-11-04', '주문','2024-11-04' , '주문'
      ]);
      console.log('Order inserted successfully ', result);
      const orders_id = result.insertId;
      
      //여기서 부터 orderlist
      for (const book of selectedBookList) {
          const insertOrderListQuery = `
              INSERT INTO orderlist (orders_id, book_id, orderlist_count)
              VALUES (?, ?, ?)
          `;
          await req.db.query(insertOrderListQuery, [orders_id, book.book_id, book.book_count]);

          //주문을 했으니 장바구니에서 없애주어야함. -> req.session.basket_id과 주문한 selectedBookList이용
          req.db.query(
              'delete from basketlist where basket_id = ? and book_id = ?',
              [req.session.basket_id, book.book_id])
      }


      if (selectedPoint)
      {
        let stamp = parseInt(check[0].stamp)
        stamp = stamp - 10;
        await req.db.query(
          'UPDATE user SET stamp = ? WHERE user_id = ?',
          [stamp, req.session.user_id]
        )
      }
      else
      {
        let stamp = parseInt(check[0].stamp)
        stamp = stamp + 1;
        await req.db.query(
          'UPDATE user SET stamp = ? WHERE user_id = ?',
          [stamp, req.session.user_id]
        )
      }


      return res.send(
          `<script type="text/javascript">
          alert("주문이 성공적으로 처리되었습니다.");
          location.href='/';
          </script>`
      );

  }
  catch(error){
      console.log(error);
      return res.send(
          `<script type="text/javascript">
          alert("주문 처리 중 오류가 발생했습니다.");
          location.href='/';
          </script>`
      );
  }
})

// ---------------------------------------- 주문 내역 페이지 -------------------
router.get('/orderpagelist', async (req, res) => {
  console.log("here")

  if (!req.session.user_id || !req.session.basket_id)
  {
    return res.send(
      `<script type="text/javascript">
      alert("로그인을 먼저 해주세요.");
      location.href='/';
        </script>`
    );
  }

  try
  {
    const ordersList = await req.db.query(
      'select * from orders where user_id = ?'
      ,[req.session.user_id]
    )
    console.log(ordersList)

    return res.render('orderpagelist', {ordersList:ordersList});


  }catch(error)
  {
    console.log(error)
  }

})

// ----------------------------- 주문 내역 상세 페이지 ----------------------
router.get('/orderpagelist/:orders_id', async (req, res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const orders_id = req.params.orders_id;
  try {
    const checkorderlist = await req.db.query(
        'select * from orderlist inner join booklist on orderlist.book_id = booklist.book_id where orderlist.orders_id = ?'
    ,[orders_id])
    console.log("checkorderlist : ", checkorderlist)
    res.render('orderpagelistdetail', {checkorderlist: checkorderlist});
}
catch(error){
    console.log(error);
}    
})

module.exports = router;
