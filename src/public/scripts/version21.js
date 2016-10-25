var data = [
  {id: 1, author: "Pete Hunt", text: "This is one comment"},
  {id: 2, author: "Jordan Walke", text: "This is *another* comment"}
];

var Comment = React.createClass({
  rawMarkup: function() {
    var md = new Remarkable();
    var rawMarkup = md.render(this.props.children.toString());
    return {__html: rawMarkup}
  },
  render: function(){
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={this.rawMarkup()}/>
      </div>
    );
  }
});

var CommentList = React.createClass({
  render: function(){
      var commentNodes = this.props.data.map(function(comment){
        return (
          <Comment author={comment.author} key={comment.id}>
          {comment.text}
          </Comment>
        );
      });//Cierro map
      return (
        <div className="commentList">
          {commentNodes}
        </div>
      );
    }
  }
);

var CommentForm = React.createClass({
  // el placeholder tiene algo, pero el state del componente empieza vacio
  getInitialState: function(){
    return {author: '', text: ''};
  },
  // Handlers para cada campo. React me inyecta handlers de eventos en lugares
  // como onChange en cada elemento, estos handlers van a ejecutarse
  // cuando se dispare onChange y van a actualizar el state del componente
  handleAuthorChange: function(e){
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e){
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e){
    // con este prevent freno al browser de que haga la petición él por su cuenta
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if(!text||!author){
      return;
    }
    // para submitear el comment ejecuto el callback que le pasaron al componente
    this.props.onCommentSubmit({author: author, text: text});
    //limpio el state del formulario luego de hacer el submit
    this.setState({author: '', text: ''});
  },
  render: function(){
    return(
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your name" value={this.state.author}
        onChange={this.handleAuthorChange}/>
        <input type="text" placeholder="Say something..." value={this.state.text}
        onChange={this.handleTextChange}/>
        <input type="submit" value="Post" />
      </form>
    );
  }
});

//el componente padre de la lista y del formulario para subir nuevos comments
var CommentBox = React.createClass({
  // los comments los traigo al state del componente en 'data'
  loadCommentsFromServer: function(){
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data){
        this.setState({data:data});
      }.bind(this)
    });
  },
  // es un callback que voy a pasarle al formulario para que sepa que hacer
  // en el submit del comentario
  handleCommentSubmit: function(comment){
    // antes de enviar el request al server con el nuevo comentario,
    // lo actualizo al state de mi componente. Asumo que la operacion va
    // a ser exitosa y me adelanto a mostrarlo en vez de esperar la respuesta
    // del server.
    // De todas formas, en caso de que el request de un error, vuelvo el state
    // a como estaba antes
    var comments = this.state.data;
    comment.id = Date.now();
    var newComments = comments.concat(comment);
    this.setState({data:newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data){
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err){
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    });
  },
  getInitialState: function(){
    return {data:[]};
  },
  //la primera vez que se renderiza, lo seteo para que se actualice por un timer
  componentDidMount: function(){
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer,this.props.pollInterval);
  },
  render: function(){
    //le paso el callback por las props al formulario
    return(
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
  );
  }
});

ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={2000}/>,
  document.getElementById('content')
);
