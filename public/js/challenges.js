'use strict'

let $submits = $('.btn')
let $chart   = $('#chart')
let ctx      = $chart.get(0).getContext('2d')

$submits.click(function (e) {
    e.preventDefault()

    let q = 'Appelez un membre de l\'animation pour faire valider votre challenge. Il entrera le mot de passe'
    let token = window.prompt(q)

    $
        .ajax({
            type: 'post',
            url : '/challenges/submit',
            data: {
                token: token,
                index: $submits.index($(this)),
                team : 'blue'
            }
        })
        .then(function (data) {
            if (data) {
                location.reload()
            } else {
                window.alert('Code invalide')
            }
        })

    return false
})

let myDoughnutChart = new Chart(ctx).Doughnut([
    {
        value    : $chart.data('blue'),
        color    : '#4aa3df',
        highlight: '#2980b9',
        label    : 'Équipe bleue'
    },
    {
        value    : $chart.data('red'),
        color    : '#e74c3c',
        highlight: '#c0392b',
        label    : 'Équipe rouge'
    }
], {
    animateRotate: false
})
