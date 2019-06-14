$(document).ready(function() {
  $('.delete-blog').on('click', function(e){
    $target = $(e.target);
    var id = $target.attr('data-id');
    $.ajax({
      type: 'DELETE',
      url: '/catalog/blog/'+id,
      success: function(response) {
        alert('Blog deleted');
        window.location.href='/';
      },
      error: function(err) {
        console.log(err);
      }
    });
  });
});
