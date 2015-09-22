'use strict'

module.exports = server => {
    // Tournaments list
    server.route({
        method : 'get',
        path   : '/tournaments',
        handler: (request, reply) => {
            if (!request.session.get('auth')) {
                return reply.redirect('/')
            }

            let tournaments = server.reloadDB().db('tournaments')
                .toJSON()
                .map((tournament, i) => {
                    tournament.id   = i
                    tournament.full = tournament.players === tournament.registered

                    return tournament
                })

            server.render(reply, 'tournaments', {
                admin: request.session.get('admin'),
                login: request.session.get('login'),
                tournaments
            })
        }
    })

    // Edit score
    server.route({
        method : 'post',
        path   : '/editTournament',
        handler: (request, reply) => {
            if (!request.session.get('auth')) {
                return reply.redirect('/')
            }

            let p = request.payload

            if (!p.tournamentId || !p.gameIndex || !p.roundIndex || typeof p.newScore === 'undefined' ||
                typeof p.isTop === 'undefined') {
                return reply(false)
            }

            let tournament = server.reloadDB().db('tournaments').toJSON()[p.tournamentId]
            let isOwner    = tournament.organizer === request.session.get('login')

            if (!tournament || (!request.session.get('admin') && !isOwner)) {
                return reply(false)
            }

            let game = tournament
                .tree
                [p.roundIndex]
                [p.gameIndex]

            if (p.isTop === 'true') {
                game.score1 = p.newScore
            } else {
                game.score2 = p.newScore
            }

            server.db.save()

            return reply(true)
        }
    })

    // Tournament view
    server.route({
        method : 'get',
        path   : '/tournaments/{id}',
        handler: (request, reply) => {
            if (!request.session.get('auth')) {
                return reply.redirect('/')
            }

            let tournaments = server.reloadDB().db('tournaments').toJSON()

            if (tournaments.length <= request.params.id) {
                return reply.redirect('/tournaments')
            }

            let tree = tournaments[request.params.id].tree
                .map(round => round.map(game => {
                    game.team1 = (game.team1 === null) ? '(vide)': game.team1
                    game.team2 = (game.team2 === null) ? '(vide)': game.team2

                    return game
                }))

            server.render(reply, 'tournament', {
                admin     : request.session.get('admin'),
                login     : request.session.get('login'),
                tournament: tournaments[request.params.id],
                tree      : JSON.stringify(tree),
                isOwner   : tournaments[request.params.id].organizer === request.session.get('login')
            })
        }
    })

    // Tournament creation
    server.route({
        method : 'get',
        path   : '/createTournament',
        handler: (request, reply) => {
            if (!request.session.get('auth')) {
                return reply.redirect('/')
            }

            server.render(reply, 'createTournament', {
                admin: request.session.get('admin'),
                login: request.session.get('login')
            })
        }
    })

    server.route({
        method : 'post',
        path   : '/createTournament',
        handler: (request, reply) => {
            if (!request.session.get('auth')) {
                return reply.redirect('/')
            }

            let tournaments = server.reloadDB().db('tournaments').toJSON()

            console.log(request.payload)

            tournaments.push({
                "name"      : request.payload.name,
                "game"      : request.payload.game,
                "organizer" : request.session.get('login'),
                "position"  : request.payload.position,
                "players"   : parseInt(request.payload.players, 10),
                "registered": 1,
                "id"        : tournaments.length,
                "tree"      : [
                    [
                        {
                            team1 : request.payload.yourteam,
                            team2 : null,
                            score1: 0,
                            score2: 0
                        }
                    ]
                ]
            })

            let id = tournaments.length - 1

            server.db.save()
            reply.redirect(`tournaments/${id}`)
        }
    })

    // Tournament join
    server.route({
        method : 'post',
        path   : '/joinTournament/{id}',
        handler: (request, reply) => {
            if (!request.session.get('auth')) {
                return reply.redirect('/')
            }

            let id   = request.params.id
            let nick = request.payload.nick

            let tournaments = server.reloadDB().db('tournaments').toJSON()
            let tournament = null

            if (tournaments.length > id && nick) {
                tournament = tournaments[id]
            } else {
                return reply(false)
            }

            if (tournament.registered === tournament.players) {
                return reply('full')
            }

            ++tournament.registered

            let lastFight = tournament.tree[0][tournament.tree[0].length - 1]

            if (lastFight.team2 === null) {
                lastFight.team2 = nick
            } else {
                tournament.tree[0].push({
                    team1 : nick,
                    team2 : null,
                    score1: 0,
                    score2: 0
                })
            }

            server.db.save()

            reply(id)
        }
    })
}