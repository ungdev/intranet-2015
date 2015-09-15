'use strict'

let $form = $('form')
let $user = $('input[type="text"]')
let $pwd  = $('input[type="password"]')

$form.submit(e => {
    e.preventDefault()

    $
        .ajax({
            url   : '/login',
            method: 'post',
            data  : {
                user: $user.val(),
                pwd : $pwd.val()
            }
        })
        .then(data => {
            if (!data) {
                $form.addClass('invalid')
                return
            }

            $form.removeClass('invalid')
            localStorage.setItem('token', data)
            location.href = '/home'
        })
})