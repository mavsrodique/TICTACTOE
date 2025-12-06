$(function(){
  const $cells = $('.cell');
  const $message = $('#message');
  const $reset = $('#reset');
  const $mode = $('input[name="mode"]');
  const $aiFirst = $('#ai-first');

  let board = Array(9).fill(null); // 'X' or 'O' or null
  let current = 'X';
  let gameOver = false;

  function render(){
    $cells.each(function(){
      const i = $(this).data('index');
      $(this).text(board[i] || '');
      $(this).toggleClass('disabled', !!board[i] || gameOver);
      $(this).removeClass('win-highlight');
    });
  }

  function setMessage(text){ $message.text(text); }

  function checkWin(b){
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for(const [a,b1,c] of wins){
      if(b[a] && b[a] === b[b1] && b[a] === b[c]) return {player:b[a], combo:[a,b1,c]};
    }
    if(b.every(Boolean)) return {player:'tie'};
    return null;
  }

  function finish(result){
    gameOver = true;
    if(result.player === 'tie'){
      setMessage("It's a tie.");
    } else {
      setMessage(result.player + ' wins!');
      // highlight
      result.combo.forEach(i => $cells.filter(`[data-index="${i}"]`).addClass('win-highlight'));
    }
    render();
  }

  function humanTurn(i){
    if(gameOver || board[i]) return;
    board[i] = current;
    render();
    const res = checkWin(board);
    if(res){ finish(res); return; }
    current = current === 'X' ? 'O' : 'X';
    setMessage(current + "'s turn");
    // if AI mode and it's AI's turn, schedule AI
    if($('input[name="mode"]:checked').val() === 'ai' && current === 'O'){
      setTimeout(aiMove, 260);
    }
  }

  function emptyIndices(b){ return b.map((v,i)=>v?null:i).filter(v=>v!==null); }

  function winning(b, player){
    const w = checkWin(b);
    return w && w.player === player;
  }

  function minimax(newBoard, player){
    const avail = emptyIndices(newBoard);
    const huPlayer = 'X';
    const aiPlayer = 'O';

    if(winning(newBoard, huPlayer)) return {score: -10};
    if(winning(newBoard, aiPlayer)) return {score: 10};
    if(avail.length === 0) return {score: 0};

    const moves = [];
    for(let i=0;i<avail.length;i++){
      const idx = avail[i];
      const move = {};
      move.index = idx;
      newBoard[idx] = player;

      if(player === aiPlayer){
        const result = minimax(newBoard, huPlayer);
        move.score = result.score;
      } else {
        const result = minimax(newBoard, aiPlayer);
        move.score = result.score;
      }

      newBoard[idx] = null;
      moves.push(move);
    }

    let bestMove;
    if(player === aiPlayer){
      let bestScore = -Infinity;
      moves.forEach(m => { if(m.score > bestScore){ bestScore = m.score; bestMove = m; } });
    } else {
      let bestScore = Infinity;
      moves.forEach(m => { if(m.score < bestScore){ bestScore = m.score; bestMove = m; } });
    }
    return bestMove;
  }

  function aiMove(){
    if(gameOver) return;
    const mode = $('input[name="mode"]:checked').val();
    if(mode !== 'ai') return;
    const best = minimax(board.slice(), 'O');
    const moveIndex = (best && best.index !== undefined) ? best.index : (emptyIndices(board)[0]);
    if(moveIndex === undefined) return;
    board[moveIndex] = 'O';
    render();
    const res = checkWin(board);
    if(res){ finish(res); return; }
    current = 'X';
    setMessage(current + "'s turn");
  }

  // handlers
  $cells.on('click', function(){
    const i = $(this).data('index');
    const mode = $('input[name="mode"]:checked').val();
    if(mode === 'pvp'){
      humanTurn(i);
    } else {
      // single player: human always X
      if(current !== 'X') return; // ignore clicks when AI's turn
      humanTurn(i);
    }
  });

  $reset.on('click', function(){
    board = Array(9).fill(null);
    current = 'X';
    gameOver = false;
    $cells.removeClass('win-highlight');
    setMessage(current + "'s turn");
    render();
    // if AI-first mode and AI selected
    if($('input[name="mode"]:checked').val() === 'ai' && $aiFirst.is(':checked')){
      current = 'O';
      setTimeout(aiMove, 260);
      setMessage("AI is thinking...");
    }
  });

  $mode.on('change', function(){
    // reset when switching modes
    $reset.click();
  });

  // initial render and maybe AI start
  render();
  setMessage(current + "'s turn");
  if($('input[name="mode"]:checked').val() === 'ai' && $aiFirst.is(':checked')){
    current = 'O';
    setTimeout(aiMove, 300);
    setMessage("AI is thinking...");
  }
});
