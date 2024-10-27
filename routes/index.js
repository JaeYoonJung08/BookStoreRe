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
      req.session.bookbasket = checkbasketId[0].basket_id
      console.log("req.session.user_id : " + req.session.user_id)
      console.log("req.session.userName : " +req.session.userName)
      console.log("req.session.bookbasket : " +req.session.bookbasket)
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



module.exports = router;
