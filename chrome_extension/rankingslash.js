var rankingslash__APP = (function(window, undefined) {

	var extension_id = chrome.runtime.id;
	var prod_extension_id = 'hacjmmchbhiigodcoclakcloefoamhaf';
	var app_url;
	var blog_url;
	var mfl_nfl_players = new Array(); 
	var league_teams = new Object();
	var taken_mfl_nfl_players = new Array();
	var selected_team = 0; 

	var leagues = '';


	var colors = {};
	colors['orange'] = 'D34C25';
	colors['white'] = 'FFFFFF';
	colors['light_blue'] = '6FA7F4';
	colors['dark_blue'] = '27343C';
	colors['black'] = '0C1216';

	if(typeof localStorage.selected_teams === 'undefined')
	{
		var selected_teams = new Object();
	}
	else
	{
		var selected_teams = JSON.parse(localStorage.selected_teams);	
	}

	console.log('selected teams will go below here');
	console.log(selected_teams);
	console.log(selected_team);

	if(extension_id == prod_extension_id)	//we are in production
	{
		app_url = 'http://app.rankingslash.com';
		blog_url = 'http://www.rankingslash.com';
	}
	else 	//we are in development
	{
		app_url = 'http://127.0.0.1/ci';
		blog_url = 'http://127.0.0.1/RankingSlash/website_calls';	
	}

	var leagueId = parseInt(localStorage["leagueId"]);

	var logoImageUrl = chrome.extension.getURL("images/32_32_logo.png");
	var loaderImageUrl = chrome.extension.getURL("images/loading.gif");


	var logoImageHtml = '<img id="__rankingslash_logo" src="' + logoImageUrl + '" width="32" height="32" />';
	var loaderImageHtml = '<img id="__rankingslash_loader" src="'+ loaderImageUrl+'" width="15" height="15" style="max-width: 15px; max-height: 15px;" />';

	var current_date = new Date();
	var current_year = current_date.getFullYear();
	var current_month = (current_date.getMonth())+1;

	if(current_month < 3)
	{
		current_year = current_year - 1;
	}

	var src = '';
	if($('body').find('iframe').length > 0)
	{
		var src = $('iframe').attr('src');
	}

	if(!leagueId)
	{
		leagueId = '';
	}

	var rankingForm = 	'<div id="__rankingslash_header">\
						<form name="__rankingslash_leagueId99Form" id="__rankingslash_leagueId99Form">\
							'+logoImageHtml + '\
							<span class="select-league-span"></span>\
							<span class="select-league-team-span"></span>\
							<input type="submit" value="Submit" id="leagueSubmit99" />\
							'+loaderImageHtml+'\
							<input type="button" value="Clear" id="leagueClear99" />\
							<!-- <div class="small progress"></div> -->\
						</form>\
						<form id="rankingSlashFeedbackForm">\
							<input type="text" placeholder="Feedback for  us?" id="rankingSlashFeedback" />\
							<input type="submit" value="Tell Us!" />\
						</form>\
						<form id="rankingSlashFeedbackEmailFollowUpForm">\
							Thanks!  Can we follow up with you?  \
							<input type="text" placeholder="Email" id="rankingSlashRetrieveEmail" />\
							<input type="submit" value="Yes" />\
						</form>\
						<span id="emailThankYou">\
							Thanks!  We\'ll make sure to follow up with you! \
						</span>\
					</div>';

	if(is_mfl_league_home())
	{
		var rankingForm = 	'<div id="__rankingslash_header">\
								Ranking Slash | \
								<ul id="rankingslash-navbar">\
									<li>\
										<a href="#">Available Rankings</a>\
										<ul>\
											<li>\
												<a href="#">FootballGuys</a>\
											</li>\
											<li>\
												<a href="#">Dynasty League Football</a>\
											</li>\
											<li>\
												<a href="#">FFToday</a>\
											</li>\
										</ul>\
									</li>\
								</ul>\
							</div>';

		rankingForm = '';	

	}


	//this is called after retrieve_all_mfl_players() on startup
	// retrieve_league_taken_players(leagueId) is called after in all scenarios
	function retrieve_league_teams(leagueId) 	
	{
		console.log('retrieve_league_teams called');
		$('#__rankingslash_leagueId99Form').find('span.select-league-team-span').empty();
		show_loader();
		if(league_id_is_a_number(leagueId))
		{
			get_mfl_league_teams_by_league_id(leagueId).done(handle_mfl_league_teams);		
		}
		else
		{
			hide_loader();
		}
	}

	//order of ajax calls
	// retrieve_user_leagues()
	// retrieve_all_mfl_players()
	// retrieve_league_teams()
	// retrieve_league_taken_players()


	function retrieve_league_taken_players(leagueId) 	//called immediately after retrieve_league_teams(); 
	{
		send_pageload_data_to_rs();

		show_loader();
		get_mfl_players_by_league_id(leagueId).done(handle_league_mfl_nfl_players);
	}

	function retrieve_user_leagues()
	{
		show_loader();
		get_user_leagues().done(handle_user_leagues);	//retrieve_all_mfl_players() called immediately after this is executed.
	}

	function retrieve_all_mfl_players() 	//is called immediately after retrieve_user_leagues() is finished.
	{
		show_loader();
		get_all_mfl_nfl_players().done(handle_all_mfl_nfl_players);	
	}

	if(should_show_top_header())
	{
		retrieve_user_leagues();
		$('body').prepend(rankingForm);	
	}
	else if(is_mfl_league_home())
	{
		$('body').prepend(rankingForm);
	}



	function get_user_leagues() 
	{
	    return $.ajax({
	        url : 'http://football.myfantasyleague.com/'+ current_year + '/export?TYPE=myleagues&JSON=1',
	        type: 'GET'
	    });
	}

	function get_all_mfl_nfl_players()
	{
	    return $.ajax({
	        url : 'http://football.myfantasyleague.com/'+ current_year + '/export?TYPE=players&JSON=1',
	        dataType: 'JSON',
	        type: 'GET'
	    });
	}

	function get_mfl_players_by_league_id(leagueId)
	{
		if(league_id_is_a_number(leagueId) )
		{
		    return $.ajax({
			        url : 'http://football.myfantasyleague.com/'+ current_year + '/export?TYPE=rosters&L='+leagueId+'&W=&JSON=1',
			        dataType: 'JSON',
			        type: 'GET'
			    });	
		}
	}

	function get_mfl_league_teams_by_league_id(leagueId)
	{
		console.log('leagueId inside get_mfl_league_teams_by_league_id below');
		console.log(leagueId);
		if(league_id_is_a_number(leagueId))
		{
		    return $.ajax({
		        url : 'http://football.myfantasyleague.com/'+ current_year + '/export?TYPE=league&L='+leagueId+'&W=&JSON=1',
		        dataType: 'JSON',
		        type: 'GET'
		    });	
		}
	}

	function handle_mfl_league_teams(output, textStatus, jqXHR)
	{
		var display = '';
		console.log('handle_mfl_league_teams called');
		if(output)
		{
			if(output.league)
			{
				if(output.league.franchises)
				{
					if( Object.prototype.toString.call(output.league.franchises.franchise) === '[object Array]') //check if array - if > 1, it is an array
					{
						selected_team = selected_teams[leagueId];

						display = '<select name="__rankingslash_leagueId99_team_select" id="__rankingslash_leagueId99_team_select"><option value="0">Select A Team</option>';


						$.each(output.league.franchises.franchise, function ( key, value ){
							selected_team_string = '';
							if(selected_team == value.id)
							{
								selected_team_string = ' selected="selected" ';
							}

							league_teams[value.id] = $.trim(remove_html_tags(value.name));

							display += '<option value="' + value.id + '" ' + selected_team_string + ' >' + league_teams[value.id] + '</option>';
						});
						display += '</select>';

						$('#__rankingslash_leagueId99Form').find('span.select-league-team-span').empty().append(display);
						show_submit_button();

						if(league_id_is_a_number(leagueId))
						{
							retrieve_league_taken_players(leagueId);
						}

					}
					else
					{
						console.log('not [object Array]');
					}
				}
			}
		}
	}

	function handle_user_leagues(output, textStatus, jqXHR ) 
	{
		console.log('handle_user_leagues called');
		if(output)
		{
		    if(output.leagues)	//we need to make sure that we're testing scenarios where no leagues exist for logged in user.  
		    {
		    	var display = '';
				if(output.leagues.league)
				{
					var selected_league = '';
					display = '<select name="__rankingslash_leagueId99_select" id="__rankingslash_leagueId99_select"><option value="0">Select Your League</option>';

					if( Object.prototype.toString.call( output.leagues.league ) === '[object Array]' ) //check if array - if > 1, it is an array
					{
						$.each( output.leagues.league, function( key, value ) {
							selected_league = '';
							var league_name = value.name;  
							leagues += ' | ' + value.url;
							var address_domain = value.url.split("/");
							var array_length = address_domain.length; 
							var league_code = address_domain[array_length-1];

							if(league_code == leagueId)
							{
								selected_league = ' selected="selected" ';
							}
							display += '<option value="' + league_code + '" ' + selected_league + ' >' + league_name + '</option>';
						});
					}
					else //else - only have one league in cookies.  
					{
						console.log('only have 1 league in cookies');
						var value = output.leagues.league;
						var league_name = value.name;  
						var address_domain = value.url.split("/");
						var array_length = address_domain.length; 
						var league_code = address_domain[array_length-1];
						leagues += ' | ' + value.url;
						console.log(leagues);

						selected_league = ' selected="selected" ';
						display += '<option value="' + league_code + '" ' + selected_league + ' >' + league_name + '</option>';

						leagueId = league_code;
						localStorage['leagueId'] = leagueId;
					}

					display += '</select>';

					if(display == '')
					{
						$('#__rankingslash_leagueId99').show();			
					}
					else
					{
						$('#__rankingslash_leagueId99Form').find('span.select-league-span').append(display);
					}

					retrieve_all_mfl_players();

				}
				else
				{
					no_available_leagues_message();
				}
		    }
		    else
		    {
				no_available_leagues_message();
		    }
		}
		else
		{
			no_available_leagues_message();
		}
		hide_loader();
	}

	function handle_all_mfl_nfl_players(output, textStatus, jqXHR)
	{
		console.log('handle_all_mfl_nfl_players called');
		if(output)
		{		
		    if(output.players)	//we need to make sure that we're testing scenarios where no leagues exist for logged in user.  
		    {
		    	var display = '';
				if(output.players.player)
				{
					if( Object.prototype.toString.call( output.players.player ) === '[object Array]' ) //check if array - if > 1, it is an array
					{
						$.each( output.players.player, function( key, player_object ) {
							mfl_nfl_players[player_object.id] = new Object(); 
							mfl_nfl_players[player_object.id]['name'] = player_object.name;
							mfl_nfl_players[player_object.id]['team'] = player_object.team;
							mfl_nfl_players[player_object.id]['position'] = player_object.position;
						});

						if(league_id_is_a_number(leagueId))
						{
							console.log('leaugeId is a number inside handle_all_mfl_nfl_players');
							retrieve_league_teams(leagueId);
						}

					}
				}
			}
		}
	}


	function handle_league_mfl_nfl_players(output, textStatus, jqXHR)
	{
		console.log('handle_league_mfl_nfl_players called');
		taken_mfl_nfl_players = {};
		if(output)
		{		
			console.log('if output');
		    if(output.rosters)	//we need to make sure that we're testing scenarios where no leagues exist for logged in user.  
		    {
		    	console.log('if output.rosters');
		    	var display = '';
				if(output.rosters.franchise)
				{
					console.log('if output.rosters.franchise');
					if( Object.prototype.toString.call( output.rosters.franchise ) === '[object Array]' ) //check if array - if > 1, it is an array
					{
						$.each( output.rosters.franchise, function( key, franchise_object ) 
						{
							if( Object.prototype.toString.call( franchise_object.player ) === '[object Array]' ) //check if array - if > 1, it is an array
							{
								$.each(franchise_object.player, function( key, player_object )
								{
									taken_mfl_nfl_players[player_object.id] = taken_mfl_nfl_players[player_object.id] || [];
									taken_mfl_nfl_players[player_object.id].push(franchise_object.id);	//if player is taken, id have value in it
								});
							}
						});
					}
				}

				if(if_footballguys_rankings())
				{
					console.log('if if_footballguys_rankings');
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId; 
						footballguys_rankings_cross_out_players(leagueId);     	
					}
				}
				if(if_footballguys_projections())
				{
					console.log('if footballguys projections');
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId; 
						footballguys_projections_cross_out_players(leagueId);   
					}		
				}

				if(if_footballguys_weekly_projections())
				{
					console.log('if footballguys weekly projections');
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId; 
						footballguys_weekly_projections_cross_out_players(leagueId);   
					}		
				}



				if(if_dynastyleaguefootball_website())
				{
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId; 

						dfl_cross_out_players(leagueId);
					}
				}
				if(if_fftoday_projections())
				{
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId;

						fftoday_projections_cross_out_players(leagueId);
					}
				}
				if(if_fftoday_cheatsheets())
				{
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId;

						fftoday_cheatsheets_cross_out_players(leagueId);
					}
				}

				if(if_bramel_tiers())
				{
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId;

						bramel_tiers_cross_out_players(leagueId);
					}		
				}

				if(if_dynasty_football_warehouse())
				{
					if(parseInt(leagueId)>0)
					{
						localStorage["leagueId"] = leagueId;
						dynasty_football_warehouse_cross_out_players(leagueId);
					}
				}


			}
		}
	}


	function build_rosters_array()	//	leagueId & selectedteam are already defined
	{
		var rosters_array = [];
		$.each(taken_mfl_nfl_players, function ( player_id, franchise_ids ){
			rosters_array[player_id] = []; 
			var name_array = mfl_nfl_players[player_id]['name'].split(',');
			rosters_array[player_id]['team'] = team_normalizer(mfl_nfl_players[player_id]['team']);
			rosters_array[player_id]['position'] = position_normalizer(mfl_nfl_players[player_id]['position']);
			rosters_array[player_id]['first_name'] = first_name_normalizer(name_array[1]);
			rosters_array[player_id]['last_name'] = last_name_normalizer(name_array[0]);

			// console.log(franchise_ids);
			// console.log(player_id);
			rosters_array[player_id]['franchise_id'] = franchise_ids;
		});
		// console.log(rosters_array);
		return rosters_array;
	}


	//#####################################################################################
	//#####################################################################################
	//#####################################################################################
	//
	//	UI Functions
	//
	//#####################################################################################
	//#####################################################################################
	//#####################################################################################



	function show_loader()
	{
		$('#__rankingslash_loader').show();
	}

	function hide_loader()
	{
		$('#__rankingslash_loader').hide();
	}

	function hide_feedback_span()
	{
		$('#rankingSlashFeedbackForm').hide();
	}

	function show_feedback_email_span()
	{
		$('#rankingSlashFeedbackEmailFollowUpForm').css('display','inline-block');
	}

	function hide_feedback_email_span()
	{
		$('#rankingSlashFeedbackEmailFollowUpForm').hide();

	}

	function show_email_thank_you()
	{
		$('#emailThankYou').show();	
	}

	function hide_team_select_and_submit_button()
	{
		$('#__rankingslash_leagueId99_team_select').hide();
		$('#leagueSubmit99').hide();
	}

	function show_submit_button()
	{
		$('#leagueSubmit99').show();
	}

	function clear_slashes()
	{
		if(if_footballguys_rankings())
		{
			footballguys_rankings_uncross_players();dynastyleaguefootball_
			hide_loader();
		}
		if(if_footballguys_projections())
		{
			footballguys_projections_uncross_players();
		}
		if(if_footballguys_weekly_projections())
		{
			footballguys_weekly_projections_uncross_players();
		}

		if(if_dynastyleaguefootball_website())
		{
			// dfl_uncross_players(); 
			//temporarily commenting this out. 
		}
		if(if_bramel_tiers())
		{
			bramel_tiers_uncross_players
		}
		if(if_fftoday_projections())
		{
			fftoday_projections_uncross_players();
		}
		if(if_fftoday_cheatsheets())
		{
			fftoday_cheatsheets_uncross_players();
		}
	}


	function should_show_top_header()
	{
		if(if_footballguys_rankings() || if_dynastyleaguefootball_website() || if_fftoday_projections() || if_fftoday_cheatsheets() || if_footballguys_projections() || if_footballguys_weekly_projections() || if_bramel_tiers() || if_dynasty_football_warehouse() )
		{
			return true;
		}
		return false;
	}


	function no_available_leagues_message()
	{
		leagueId = '';
		localStorage["leagueId"] = leagueId; 

		$('#__rankingslash_header').empty().append('Please login to your ' + current_year + ' MFL leagues to use rankingslash.  Then, come back and reload this page.');			
		send_pageload_data_to_rs();
	}


	//#####################################################################################
	//#####################################################################################
	//#####################################################################################
	//
	//	jQuery Event Bindings
	//
	//#####################################################################################
	//#####################################################################################
	//#####################################################################################

	if(should_show_top_header())	//don't bind these functions to these elements if we shouldn't be showing the top header at all
	{

		$('#rankingSlashFeedbackForm').live('submit', function(e){
			e.preventDefault();
			send_feedback();
		});
		$('#rankingSlashFeedbackEmailFollowUpForm').live('submit', function(e){
			e.preventDefault();
			get_email();
		});

		$('#leagueClear99').live('click', function(e){
			e.preventDefault();
			clear_slashes();
			$("#__rankingslash_leagueId99_select").val($("#__rankingslash_leagueId99_select option:first").val());	
			leagueId = '';
			localStorage["leagueId"] = leagueId; 
			hide_team_select_and_submit_button();
		});

		$('#__rankingslash_leagueId99_select').live('change', function(e){
			e.preventDefault();
			leagueId = currently_selected_league();
			if(league_id_is_a_number(leagueId))
			{
				console.log('league id IS IN FACT a number');
				console.log('leagueId = ' + leagueId);
				retrieve_league_teams(leagueId);			
			}
			else
			{
				clear_slashes();
				hide_team_select_and_submit_button();
				hide_loader();
			}
		});


		$('#__rankingslash_leagueId99Form').live('submit', function(e) { //When clicking on the close or fade layer...
			console.log('form submit for the crossout stuff');
			e.preventDefault();

			show_loader();

			selected_team = currently_selected_team();
			leagueId = currently_selected_league();

			selected_teams[leagueId] = selected_team;
			localStorage.selected_teams = JSON.stringify(selected_teams);



			if($('#__rankingslash_leagueId99').is('visible'))
			{
				var leagueId = $('#__rankingslash_leagueId99').attr('value');
			}
			else
			{
				var leagueId = $('#__rankingslash_leagueId99_select').val();
			}


			if(parseInt(leagueId)>0)
			{
				if(if_footballguys_rankings())
				{
					footballguys_rankings_uncross_players();			
				}
				if(if_footballguys_projections())
				{
					footballguys_projections_uncross_players();
				}
				if(if_footballguys_weekly_projections())
				{
					footballguys_weekly_projections_uncross_players();
				}
				if(if_dynastyleaguefootball_website())
				{
					// dfl_uncross_players();	//removed this, now dfl_cross_out_players() will automatically clear the old data. 
				}
				if(if_fftoday_projections())
				{
					fftoday_projections_uncross_players();
				}
				if(if_fftoday_cheatsheets())
				{
					fftoday_cheatsheets_uncross_players();
				}
				if(if_bramel_tiers())
				{
					bramel_tiers_uncross_players();
				}
				if(if_dynasty_football_warehouse())
				{
					dynasty_football_warehouse_uncross_players();
				}


				localStorage["leagueId"] = leagueId; 

				if(if_footballguys_rankings())
				{
					footballguys_rankings_cross_out_players(leagueId);
				}
				if(if_footballguys_projections())
				{
					footballguys_projections_cross_out_players(leagueId);
				}
				if(if_footballguys_weekly_projections())
				{
					footballguys_weekly_projections_cross_out_players(leagueId);
				}
				if(if_dynastyleaguefootball_website())
				{
					dfl_cross_out_players(leagueId);
				}
				if(if_fftoday_projections())
				{
					fftoday_projections_cross_out_players(leagueId);
				}
				if(if_fftoday_cheatsheets())
				{
					fftoday_cheatsheets_cross_out_players(leagueId);
				}
				if(if_bramel_tiers())
				{
					bramel_tiers_cross_out_players(leagueId);
				}
				if(if_dynasty_football_warehouse())
				{
					dynasty_football_warehouse_cross_out_players(leagueId);
				}
			}
			else
			{
				clear_slashes();
			}

		});
	}





		

	//#####################################################################################
	//#####################################################################################
	//#####################################################################################
	//
	//	Functions to determine which website the user is currently visiting
	//
	//#####################################################################################
	//#####################################################################################
	//#####################################################################################

	function if_bramel_tiers()
	{
		if((document.URL).search("footballguys.com") > 0)
		{
			if((document.URL).search("bramel") > 0)
			{
				if((document.URL).search("tiers") > 0)
				{
					return true;			
				}
			}
		}
		else
		{
			return false;
		}	
	}

	function if_dynastyleaguefootball_website(){
		if((document.URL).search("dynastyleaguefootball.com") > 0)
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	function if_fftoday_projections()
	{
		if((document.URL).search("fftoday.com/rankings/playerproj.php") > 0 || (document.URL).search("fftoday.com/rankings/playerwkproj.php") > 0)
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	function if_fftoday_cheatsheets()
	{
		if((document.URL).search("fftoday.com/rankings/playerrank.php") > 0 || (document.URL).search("fftoday.com/rankings/playerwkrank.php") > 0)
		{
			if((document.URL).search("o=2") == -1)
			{
				return true;
			}
		}
		return false;
	}

	function if_footballguys_rankings()
	{
		if((document.URL).search("footballguys.com") > 0)
		{
			if((document.URL).search("viewrankings") > 0)
			{
				return true;			
			}
		}
		else
		{
			return false;
		}
	}

	function if_footballguys_projections()
	{
		if((document.URL).search("footballguys.com") > 0)
		{
			if((document.URL).search("myviewprojections.php") > 0)
			{
				return true;			
			}
		}
		else
		{
			return false;
		}
	}



	function if_footballguys_weekly_projections()
	{
		if((document.URL).search("footballguys.com") > 0)
		{
			if((document.URL).search("myweeklycheatsheet.php") > 0)
			{
				return true;			
			}
		}
		else
		{
			return false;
		}
	}

	function if_dynasty_football_warehouse()
	{
		if((document.URL).search("dynastyfootballwarehouse.com") > 0)
		{
			return true;			
		}
		return false;
	}




	function is_mfl_league_home()
	{
		if((document.URL).search("myfantasyleague.com") > 0)
		{
			if((document.URL).search("/home/") > 0)
			{
				return true;
			}
		}
		return false;
	}



	//#####################################################################################
	//#####################################################################################
	//#####################################################################################
	//
	//				Uncrossing Out functions below. 
	//
	//#####################################################################################
	//#####################################################################################
	//#####################################################################################

	function bramel_tiers_uncross_players()
	{
		$('div.article-content table tr').each( function(){
			var this_link = $(this).find("td:nth-child(1) a");
			var this_td = $(this).find('td:nth-child(1)');

			this_link.attr('style','text-decoration: none; font-weight: normal; color: #385DAD;'); 
			this_td.css('text-decoration', 'none');
		});
	}

	function dfl_uncross_players()
	{	
		show_loader();

	    $.get(src, function(dfl_data, dfl_textStatus, dfl_jqXHR)
	    {
			$('iframe').attr('src','');

			setTimeout ( function () {
		        var iframeBody  = $("iframe").first().contents ().find ("body");

				var original_result_jquery_object = $('<div/>').html($.parseHTML( dfl_data ));

		        original_result_jquery_object.find('div.active').find('tbody').find('tr').each( function () 
		        {
					var this_link = $(this).find('td a'); 
					this_link.attr('style','font-weight: normal; text-decoration:none;'); 
				});

				iframeBody.append(original_result_jquery_object.html());
				hide_loader();
			});
		}); 

	}

	function footballguys_rankings_uncross_players()
	{
		console.log('footballguys_rankings_uncross_players');
		$('td.la a').attr('style','');
		$('td.la a').attr('value','');
		$('td.la a').each( function () {
			var this_link = $(this); 
			this_link.attr('style','text-decoration: none;'); 
			this_link.attr('style','color: #; font-weight: normal;'); 
		}); 
	}

	function footballguys_projections_uncross_players()
	{
		console.log('footballguys_projections_uncross_players');

		$('table.datamedium tr').each( function(){
			var this_link = $(this).find("td:nth-child(2) a"); 
			this_link.attr('style','text-decoration: none; font-weight: normal; color: #385DAD;'); 
		});
	}

	function footballguys_weekly_projections_uncross_players()
	{
		console.log('footballguys_weekly_projections_uncross_players()');
		$('table.data tr.team0').each( function(){
			var this_link = $(this).find("td:nth-child(2) a"); 
			this_link.attr('style','text-decoration: none; font-weight: normal; color: #385DAD;'); 
		});
	}


	function fftoday_projections_uncross_players()
	{
	    $('tr.tableclmhdr').parent().find('tr').each(function() 
	    { 
			var this_link = $(this).find("td:nth-child(2) a");
			this_link.attr('style','font-weight: normal'); 
	    });
	}

	function fftoday_cheatsheets_uncross_players()
	{
	    $('tr.tableclmhdr').parent().find('tr').each(function() 
	    { 
			var this_link = $(this).find("td:nth-child(3) a");
			this_link.attr('style','text-decoration:none; font-weight: normal;'); 
	    });

	}

	function dynasty_football_warehouse_uncross_players(){
		return true;
	}



	//#####################################################################################
	//#####################################################################################
	//#####################################################################################
	//
	//	Cross Out (slashing) functions below. 
	//
	//#####################################################################################
	//#####################################################################################
	//#####################################################################################

	function bramel_tiers_cross_out_players(leagueId)
	{
		show_loader();

		if(leagueId> 1)
		{

			var rosters_array = build_rosters_array();

			var rankingsArray = [];
			var rankingsCount = 0;
			$('div.article-content table tr').each( function(){
				var this_link = $(this).find("td:nth-child(1) a");
				var this_td = $(this).find('td:nth-child(1)');
				
				this_link.attr('style','text-decoration: none; font-weight: bold; color: #000000;'); 

				var fb_name_array = $(this).find("td:nth-child(1)").text().split(' ');

				var fb_position = $(this).find("td:nth-child(3)").text().substring(0,2);

				var fb_first_name = fb_name_array[0]; 
				var fb_last_name = fb_name_array[1]

				if(fb_name_array[2])
				{
					fb_last_name += ' ' + fb_name_array[2];
				}

				fb_position = position_normalizer(fb_position);
				fb_first_name = first_name_normalizer(fb_first_name);
				fb_last_name = last_name_normalizer(fb_last_name);	//this was commented out - not sure why.  

				rankingsArray[rankingsCount] = []; 
				rankingsArray[rankingsCount]['position'] = fb_position;
				rankingsArray[rankingsCount]['first_name'] = fb_first_name;
				rankingsArray[rankingsCount]['last_name'] = fb_last_name;

				rosters_array.map(function (player) {
					if (player.last_name == fb_last_name ) 
					{
						if(player.first_name == fb_first_name)
						{
							if(position_compare(player.position, fb_position))
							{
								if(does_this_match_the_selected_team(player.franchise_id, selected_team))
								{
									this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
								}
								else 	//taken, not on the selected team.
								{
									this_link.attr('style','text-decoration: line-through; font-weight: normal; color: #385DAD;'); 
									this_td.css('text-decoration', 'line-through');
								}
								found = true;


							}
						}
					} 
				}); // => [null, { "name": "john", "dinner": "sushi" }, null]


				rankingsCount++; 




			});

			hide_loader();
		}
	}

	function dfl_cross_out_players(leagueId)
	{
		console.log('dfl_cross_out_players function started');
		show_loader();
		var rankings_iframe; 
		var rankings_source;

		var rosters_array = build_rosters_array();

	    $.get(src, function(dfl_data, dfl_textStatus, dfl_jqXHR)
	    {
			var rankingsArray = [];
			var rankingsCount = 0;

			//get the nth iframe with the source we need that has the rankings.  
			//then use that number instead of first.  First is giving us a google syndicated iframe, which is incorrect.  
			$('iframe').each(function(){
				var this_source = $(this).attr('src');
				$(this).attr('not_source',this_source);
				if(this_source != null)
				{
					if(this_source.indexOf("fantasyleaguerankings.com") != -1)
					{
						rankings_iframe = $(this);
						rankings_source = this_source;
						console.log(this_source);
						console.log('the rankings iframe source = ' + this_source);
					}					
				}
			});
			rankings_iframe.attr('src','');	//you get an error when selecting contents about the origin if you don't clear the src.



			setTimeout ( function () {
			    // $.get(src, function(rankings_data, rankings_textStatus, rankings_jqXHR)
			    // {
			    // 	console.log($('#ranktable'));
			    // 	console.log(rankings_data);
			    // 	console.log(rankings_textStatus);
			    // 	console.log(rankings_jqXHR);
			    // });

				rankings_iframe.load(function(){
					var src = $('#iframe').contents().find("html").html();
					alert(src);
				});

		        var iframeBody  = rankings_iframe.contents().find("body");
		        console.log('_________________________________');
				console.log(rankings_iframe.get(0).contentWindow.document.body.innerHTML);
				console.log(rankings_iframe.get(0).contentWindow.document.body);
				console.log(rankings_iframe.get(0).contentWindow.document);
		        // console.log(rankings_iframe.contents().html;

		        console.log('rankings_iframe below this');
		        console.log(rankings_iframe);
		        console.log('rankings_iframe contents below this');
		        console.log(rankings_iframe.contents());
		        console.log(rankings_iframe.find('html'));
		        console.log('iframeBody below this');
		        console.log(iframeBody);

		        // var iframeBody  = rankings_iframe.contents().find("#ranktable");
		        // console.log('iframeBody below this-#ranktable');
		        // console.log(iframeBody);


				var original_result_jquery_object = $('<div/>').html($.parseHTML( dfl_data ));

		        original_result_jquery_object.find('div.active').find('tbody').find('tr').each( function () 
		        {
		        	console.log('each time looks through original result jquery object');
					var fb_team;

					var fb_name = $(this).find("td:nth-child(2)").text();
					var fb_position = $(this).find("td:nth-child(3)").text();
					var fb_team = $(this).find("td:nth-child(4)").text();


					var first_split;

					var fb_first_name; 
					var fb_last_name;

					if(fb_name)
					{
						fb_name = replaceNbsps(fb_name);

						var has_name = false;
						if (fb_name.indexOf(' ') > -1) 
						{ 
							first_split = fb_name.split(' ');
							fb_first_name = first_split[0]; 
							fb_last_name = first_split[1];
							has_name = true;

							if(first_split[2])
							{
								fb_last_name += ' ' + first_split[2];
							}

						}

						if(!has_name)
						{
							fb_first_name = '----------------';
							fb_last_name = "_____________________";
						}

					}
					else
					{
						fb_first_name = '----------------';
						fb_last_name = "_____________________";						
					}

					fb_team = team_normalizer(fb_team);
					fb_position = position_normalizer(fb_position);
					fb_last_name = last_name_normalizer(fb_last_name);
					fb_first_name = first_name_normalizer(fb_first_name);


					rankingsArray[rankingsCount] = []; 
					rankingsArray[rankingsCount]['team'] = fb_team;
					rankingsArray[rankingsCount]['position'] = fb_position;
					rankingsArray[rankingsCount]['first_name'] = fb_first_name;
					rankingsArray[rankingsCount]['last_name'] = fb_last_name;

					var found = false;

					var this_link = $(this).find('td a'); 

					rosters_array.map(function (player) 
					{
						if (player.last_name == fb_last_name ) 
						{
							if(position_compare(player.position, fb_position))
							{
								if(player.team == fb_team) 
								{
									if(does_this_match_the_selected_team(player.franchise_id, selected_team))
									{
										this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
									}
									else 	//taken, not on the selected team.
									{
										this_link.attr('style','text-decoration: line-through;'); 
									}
									found = true;
								}
							}
						} 
					}); // => [null, { "name": "john", "dinner": "sushi" }, null]


					if(!found)
					{
						this_link.attr('style','color: #000000; font-weight: bold;'); 
					}


					rankingsCount++; 
				});

				iframeBody.append(original_result_jquery_object.html());
				hide_loader();
			});

		}); 
	}


	function footballguys_projections_cross_out_players(leagueId)
	{
		show_loader();

		if(leagueId> 1)
		{
			var rosters_array = build_rosters_array();

			var rankingsArray = [];
			var rankingsCount = 0;

			$('table.datamedium tr').each( function(){
				var this_link = $(this).find("td:nth-child(2) a"); 
				
				this_link.attr('style','text-decoration: none; font-weight: bold; color: #000000;'); 

				var fb_name_array = $(this).find("td:nth-child(2)").text().replace(/\[.*?\]/g, "").trim().split(' ');
				var fb_team_bye_array = $(this).find("td:nth-child(3)").text().replace(/\[.*?\]/g, "").trim().split('/');

				var fb_team = fb_team_bye_array[0];
				var fb_first_name = fb_name_array[0]; 
				var fb_last_name = fb_name_array[1]

				if(fb_name_array[2])
				{
					fb_last_name += ' ' + fb_name_array[2];
				}

				fb_first_name = first_name_normalizer(fb_first_name);
				fb_last_name = last_name_normalizer(fb_last_name);	//this was commented out - not sure why.  

				fb_team = team_normalizer(fb_team);

				rankingsArray[rankingsCount] = []; 
				rankingsArray[rankingsCount]['team'] = fb_team;
				// rankingsArray[rankingsCount]['position'] = fb_position;
				rankingsArray[rankingsCount]['first_name'] = fb_first_name;
				rankingsArray[rankingsCount]['last_name'] = fb_last_name;


				rosters_array.map(function (player) {
					if (player.last_name == fb_last_name ) 
					{
						if(player.first_name == fb_first_name)
						{
							if(player.team == fb_team) 
							{
								if(does_this_match_the_selected_team(player.franchise_id, selected_team))
								{
									this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
								}
								else 	//taken, not on the selected team.
								{
									this_link.attr('style','text-decoration: line-through; font-weight: normal; color: #385DAD;'); 
								}
							}
						}
					}
				}); // => [null, { "name": "john", "dinner": "sushi" }, null]


				rankingsCount++; 
			});

			hide_loader();
		}
	}







	function footballguys_weekly_projections_cross_out_players(leagueId)
	{
		console.log('weekly projections cross out players');
		show_loader();

		if(leagueId> 1)
		{
			var rosters_array = build_rosters_array();

			var rankingsArray = [];
			var rankingsCount = 0;

			console.log('table.data tr.each ');
			$('table.data tr').each( function(){
				var this_link = $(this).find("td:nth-child(2) a"); 
				
				this_link.attr('style','text-decoration: none; font-weight: bold; color: #000000;'); 

				var fb_name_array = $(this).find("td:nth-child(2)").text().replace(/\[.*?\]/g, "").trim().split(' ');
				var fb_team = $(this).find("td:nth-child(3)").text();

				var fb_first_name = fb_name_array[0]; 
				var fb_last_name = fb_name_array[1]

				if(fb_name_array[2])
				{
					fb_last_name += ' ' + fb_name_array[2];
				}

				fb_first_name = first_name_normalizer(fb_first_name);
				fb_last_name = last_name_normalizer(fb_last_name);	//this was commented out - not sure why.  

				fb_team = team_normalizer(fb_team);

				rankingsArray[rankingsCount] = []; 
				rankingsArray[rankingsCount]['team'] = fb_team;
				// rankingsArray[rankingsCount]['position'] = fb_position;
				rankingsArray[rankingsCount]['first_name'] = fb_first_name;
				rankingsArray[rankingsCount]['last_name'] = fb_last_name;


				rosters_array.map(function (player) {
					if (player.last_name == fb_last_name ) 
					{
						if(player.first_name == fb_first_name)
						{
							if(player.team == fb_team) 
							{
								if(does_this_match_the_selected_team(player.franchise_id, selected_team))
								{
									this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
								}
								else 	//taken, not on the selected team.
								{
									this_link.attr('style','text-decoration: line-through; font-weight: normal; color: #385DAD;'); 
								}
							}
						}
					}
				}); // => [null, { "name": "john", "dinner": "sushi" }, null]


				rankingsCount++; 
			});

			hide_loader();
		}
	}









	function footballguys_rankings_cross_out_players(leagueId) 
	{ 
		show_loader();

		if(leagueId> 1)
		{
			$('td.la a').attr('style','');
			$('td.la a').attr('value','');

			var rosters_array = build_rosters_array();


			var rankingsArray = [];
			var rankingsCount = 0;
			$('td.la a').each( function () {	//traversing the FootballGuys page
				var fb_split1 = $(this).text().split(', ');  
				var fb_team = fb_split1[1];
				var fb_split2 = fb_split1[0].split(' '); 
				var fb_position = fb_split2[0]; 
				var fb_first_name = fb_split2[1]; 
				var fb_last_name = fb_split2[2]
				if(fb_split2[3])
				{
					fb_last_name += ' ' + fb_split2[3];
				}


				fb_team = team_normalizer(fb_team);
				fb_position = position_normalizer(fb_position);
				fb_last_name = last_name_normalizer(fb_last_name);
				fb_first_name = first_name_normalizer(fb_first_name);


				rankingsArray[rankingsCount] = []; 
				rankingsArray[rankingsCount]['team'] = fb_team;
				rankingsArray[rankingsCount]['position'] = fb_position;
				rankingsArray[rankingsCount]['first_name'] = fb_first_name;
				rankingsArray[rankingsCount]['last_name'] = fb_last_name;

				var this_link = $(this); 


				rosters_array.map(function (player) 
				{
					if (player.last_name == fb_last_name ) 
					{
						if(position_compare(player.position, fb_position))
						{
							if(player.team == fb_team) 
							{
								if(does_this_match_the_selected_team(player.franchise_id, selected_team))
								{
									this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 								
								}
								else
								{
									this_link.attr('style','text-decoration: line-through;'); 
								}

								this_link.attr('value','1');
							}
						}
					} 
				}); // => [null, { "name": "john", "dinner": "sushi" }, null]

				if(this_link.attr('value') != '1')
				{
					this_link.attr('style','color: #000000; font-weight: bold;'); 
				}

				rankingsCount++; 
			}); 
			hide_loader();
		}
	}



	function fftoday_projections_cross_out_players(leagueId)
	{
		show_loader();

		if(leagueId> 1)
		{

			var rosters_array = build_rosters_array();

			var rankingsArray = [];
			var rankingsCount = 0;


		    $('tr.tableclmhdr').parent().find('tr').each(function() 
		    { 
				var fb_split1 = $(this).find("td:nth-child(2)").text().split(' ');
				var fb_team = $(this).find("td:nth-child(3)").text();

				var fb_first_name = fb_split1[0];

				if(fb_first_name != "")
				{
					fb_first_name = $.trim(fb_first_name);
				}

				var fb_last_name = fb_split1[1];


				if(fb_split1[2])
				{
					fb_last_name += ' ' + fb_split1[2];
				}

				if(fb_last_name)	//if no last_name, this isn't a player's cell
				{
					fb_last_name = last_name_normalizer(fb_last_name);
					fb_first_name = first_name_normalizer(fb_first_name);
					fb_team = team_normalizer(fb_team);

					rankingsArray[rankingsCount] = []; 
					rankingsArray[rankingsCount]['team'] = fb_team;
					rankingsArray[rankingsCount]['first_name'] = fb_first_name;
					rankingsArray[rankingsCount]['last_name'] = fb_last_name;

					var this_link = $(this).find("td:nth-child(2) a");


					rosters_array.map(function (player) {
						if (player.last_name == fb_last_name ) 
						{
							if(player.first_name == fb_first_name)
							{
								if(player.team == fb_team)
								{
									console.log(player.franchise_id);
									console.log(selected_team);
									if(does_this_match_the_selected_team(player.franchise_id, selected_team))
									{
										this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
									}
									else 	//taken, not on the selected team.
									{
										this_link.attr('style','text-decoration: line-through;');
									}
									this_link.attr('value','1');
								}
							}
						}
					});


					if(this_link.attr('value') != '1')
					{
						this_link.attr('style','color: #000000; font-weight: bold;'); 
					}

					rankingsCount++; 
				}
		    });

			hide_loader();
		}
	}

	function fftoday_cheatsheets_cross_out_players(leagueId)
	{
		show_loader();

		if(leagueId> 1)
		{
			rosters_array = build_rosters_array();

			var rankingsArray = [];
			var rankingsCount = 0;


		    $('tr.tableclmhdr').parent().find('tr').each(function() 
		    { 
				var fb_split1 = $(this).find("td:nth-child(3)").text().split(' ');
				var fb_team = $(this).find("td:nth-child(4)").text();

				var fb_first_name = fb_split1[0];

				if(fb_first_name != "")
				{
					fb_first_name = $.trim(fb_first_name);
				}

				var fb_last_name = fb_split1[1];


				if(fb_split1[2])
				{
					fb_last_name += ' ' + fb_split1[2];
				}

				if(fb_last_name)	//if no last_name, this isn't a player's cell
				{
					fb_last_name = last_name_normalizer(fb_last_name);
					fb_first_name = first_name_normalizer(fb_first_name);
					fb_team = team_normalizer(fb_team);

					rankingsArray[rankingsCount] = []; 
					rankingsArray[rankingsCount]['team'] = fb_team;
					rankingsArray[rankingsCount]['first_name'] = fb_first_name;
					rankingsArray[rankingsCount]['last_name'] = fb_last_name;

					var this_link = $(this).find("td:nth-child(3) a");
					this_link.attr('style','color: #000000; font-weight: bold;'); 

					rosters_array.map(function (player) {
						if (player.last_name == fb_last_name ) 
						{
							if(player.first_name == fb_first_name)
							{
								if(player.team == fb_team)
								{
									if(does_this_match_the_selected_team(player.franchise_id, selected_team))
									{
										this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
									}
									else 	//taken, not on the selected team.
									{
										this_link.attr('style','text-decoration: line-through; font-weight: normal;');
									}
								}
							}
						}
					});

					rankingsCount++; 

				}


		    });

			hide_loader();
		}
	}

	function dynasty_football_warehouse_cross_out_players(leagueId){
		console.log('---------------------------------');
		console.log('---------------------------------');
		console.log('---dfw cross out players called----');
		console.log('---------------------------------');
		console.log('---------------------------------');
		show_loader();

		if(leagueId> 1)
		{
			rosters_array = build_rosters_array();

			var rankingsArray = [];
			var rankingsCount = 0;

			var position_bool = false;
			var name_bool = false;
			var team_bool = false;
			var position_td_num, name_td_num, team_td_num;
			$('thead tr').parent().find('th').each(function(index, value)
			{
				var th_name = $(value).text();
				var usable_index = index+1;
				if(th_name == 'Pos.' || th_name == 'Position' || th_name == 'position')
				{
					position_bool = true;
					position_td_num = usable_index;
				}

				if(th_name == 'Team' || th_name == 'team' || th_name == 'Pro Team' || th_name == 'pro team')
				{
					team_bool = true;
					team_td_num = usable_index;
				}

				if(th_name == 'Name' || th_name == 'name' || th_name == 'player' || th_name == 'Player')
				{
					name_bool = true;
					name_td_num = usable_index;
				}

			});


		    $('tbody tr').parent().find('tr').each(function() 
		    { 
				var fb_split1 = $(this).find("td:nth-child("+name_td_num+")").text().split(' ');

				var fb_team = $(this).find("td:nth-child("+team_td_num+")").text();

				var fb_first_name = fb_split1[0];

				if(fb_first_name != "")
				{
					fb_first_name = $.trim(fb_first_name);
				}

				var fb_last_name = fb_split1[1];


				if(fb_split1[2])
				{
					fb_last_name += ' ' + fb_split1[2];
				}

				if(fb_last_name)	//if no last_name, this isn't a player's cell
				{
					fb_last_name = last_name_normalizer(fb_last_name);
					fb_first_name = first_name_normalizer(fb_first_name);
					fb_team = team_normalizer(fb_team);

					rankingsArray[rankingsCount] = []; 
					rankingsArray[rankingsCount]['team'] = fb_team;
					rankingsArray[rankingsCount]['first_name'] = fb_first_name;
					rankingsArray[rankingsCount]['last_name'] = fb_last_name;

					var this_link = $(this).find("td:nth-child(2)");
					this_link.attr('style','color: #000000; font-weight: bold;'); 

					rosters_array.map(function (player) {
						if (player.last_name == fb_last_name ) 
						{
							if(player.first_name == fb_first_name)
							{
								if(player.team == fb_team)
								{
									if(does_this_match_the_selected_team(player.franchise_id, selected_team))
									{
										this_link.attr('style','text-decoration: none; font-weight: bold; color: #' + colors['orange'] + ';'); 
									}
									else 	//taken, not on the selected team.
									{
										this_link.attr('style','text-decoration: line-through; font-weight: normal;');
									}
								}
							}
						}
					});

					rankingsCount++; 

				}


		    });

			hide_loader();
		}
	}



	//###########################################################################################
	//###########################################################################################
	//###########################################################################################
	//
	//			FUNCTIONS FOR FINDING VALUES ON THE SCREEN
	//
	//###########################################################################################
	//###########################################################################################
	//###########################################################################################


	function currently_selected_team()
	{
		return $('#__rankingslash_leagueId99_team_select').val();
	}

	function currently_selected_league()
	{
		if($('#__rankingslash_leagueId99').is('visible'))
		{
			return $('#__rankingslash_leagueId99').attr('value');
		}
		else
		{
			return $('#__rankingslash_leagueId99_select').val();
		}
	}




	//###########################################################################################
	//###########################################################################################
	//###########################################################################################
	//
	//			NORMALIZER FUNCTIONS FOR TEAMS/POSITIONS
	//
	//###########################################################################################
	//###########################################################################################
	//###########################################################################################

	function position_normalizer(fb_position)
	{
		if(typeof fb_position === 'undefined'){
			return '';
		}
		else
		{
			fb_position = fb_position.toLowerCase();

			if (fb_position == 'ilb')
			{
				fb_position = 'lb';
			}
			else if (fb_position == 'olb')
			{
				fb_position = 'lb'; 
			}
			else if(fb_position == 'ss')
			{
				fb_position = 's';
			}
			else if(fb_position == 'fs')
			{
				fb_position = 's';
			}
			else if(fb_position == 'gbp')
			{
				fb_position = 's';
			}
			else if(fb_position == 'nt')
			{
				fb_position = 'dt';
			}

			if(fb_position == 'dt')
			{
				fb_position = 'de';
			}
			if(fb_position == 'lb')
			{
				fb_position = 'de';
			}
			return fb_position;
		}
	}

	function team_normalizer(fb_team)
	{
		if(typeof fb_team === 'undefined'){
			return '';
		}
		else
		{
			fb_team = fb_team.toLowerCase();
			if(fb_team == 'ha')
			{
				fb_team = 'gbp';
			}
			if(fb_team == 'gb')
			{
				fb_team = 'gbp'; 
			}
			else if(fb_team == 'no')
			{
				fb_team = 'nos';
			}
			else if(fb_team == 'ne')
			{
				fb_team = 'nep';
			}
			else if(fb_team == 'sd')
			{
				fb_team = 'sdc';
			}
			else if(fb_team == 'tb')
			{
				fb_team = 'tbb';
			}
			else if(fb_team == 'sf')
			{
				fb_team = 'sfo';
			}
			else if(fb_team == 'jax')
			{
				fb_team = 'jac';
			}
			else if(fb_team == 'kc')
			{
				fb_team = 'kcc';
			}

			return fb_team;
		}
	}

	function last_name_normalizer(last_name)
	{
		if(typeof last_name === 'undefined'){
			return '';
		}
		else
		{

			last_name = last_name.replace(/\./g, '');
			last_name = last_name.replace(/\'/g, '');
			last_name = last_name.replace(/\-/g, '');
			last_name = last_name.replace(/\*/g, '');
			last_name = last_name.replace(' Jr', '');
			last_name = last_name.toLowerCase();
			if(last_name == 'vannoy')
			{
				last_name = 'van noy';
			}
			last_name = remove_brackets(last_name);
			return last_name;
		}
	}

	function first_name_normalizer(first_name)
	{
		if(typeof first_name === 'undefined'){
			return '';
		}
		else
		{
			first_name = $.trim(first_name);
			first_name = first_name.toLowerCase();
			first_name = first_name.replace(/\./g, '');
			first_name = first_name.replace(/\'/g, '');
			first_name = first_name.replace(/\-/g, '');

			if(first_name == 'jon' || first_name == 'jonathan' || first_name == 'johnathan')
			{
				first_name = 'john';
			}
			else if(first_name == 'joshua')
			{
				first_name = 'josh';
			}
			else if(first_name == 'daniel')
			{
				first_name = 'dan';
			}
			else if(first_name == 'jeremiah')
			{
				first_name = 'jay';
			}
			else if(first_name == 'michael')
			{
				first_name = 'mike';
			}
			else if(first_name == 'ha' || first_name == 'ha ha' || first_name == 'haha')
			{
				first_name = 'hasean';
			}
			return first_name;
		}
	}

	function position_compare(position1, position2)
	{
		position1 = $.trim(position1);
		position2 = $.trim(position2);

		if(position1 == position2)
		{
			return true;
		}
		else if(position1 == 'db' && (position2 == 's' || position2 == 'cb'))
		{
			return true;
		}
		else if((position1 == 's' || position1 == 'cb') && position2 == 'db')
		{
			return true;
		}
		else if(position1 == 'dl' && (position2 == 'dt' || position2 == 'de'))
		{
			return true;
		}
		else if((position1 == 'dt' || position1 == 'de') && position2 == 'dl')
		{
			return true;
		}
		return false;
	}

	function player_normalizer(player_array)
	{
		return false;
	}

	function does_this_match_the_selected_team(teams_player_is_on, selected_team)
	{
		if( Object.prototype.toString.call(teams_player_is_on) === '[object Array]')
		{
			var does_franchise_id_match = false;
			$.each(teams_player_is_on, function ( key, value ){
				if(value == selected_team)
				{
					does_franchise_id_match = true;
				}
			});
		}
		else
		{
			console.log('not an array');
		}
		if(does_franchise_id_match || teams_player_is_on == selected_team) 	//this player is on the currently selected team
		{
			return true;
		}
		else 	//taken, not on the selected team.
		{
			return false;
		}
	}


	//#####################################################################################
	//#####################################################################################
	//#####################################################################################
	//
	//	AJAX Functions
	//
	//#####################################################################################
	//#####################################################################################
	//#####################################################################################

	function send_pageload_data_to_rs()
	{
		leagues = (typeof leagues === "undefined") ? "" : leagues;
		var current_url = document.URL;
		console.log('-----------------');
		console.log('ajax leagues below');
		console.log(leagues);
		console.log('ajax current_url below');
		console.log(current_url);

		var team_id = $('#__rankingslash_leagueId99_team_select').val();
		var team_name = $('#__rankingslash_leagueId99_team_select').find('option:selected').text();

		$.ajax({
			url: app_url + "/chrome_extension_pageload/create",
			data: "league=" + leagues + '&ranking_url=' + current_url + '&team_id=' + team_id + '&team_name=' + team_name,
			type: "POST",
			error: function(jqXHR, textStatus, errorThrown){
				error_reporting(jqXHR, textStatus, errorThrown);
				return false;
			},
			success: function(output){
				return true;
			}
		});
	}


	function send_feedback()
	{
		var feedback = $('#rankingSlashFeedback').val();
		show_loader();
		$.ajax({
		  url: blog_url + "/feedback.php",
		  data: "feedback="+feedback,
		  dataType: "json",
		  type: "GET",
		  error: function(jqXHR, textStatus, errorThrown){
			show_feedback_email_span();
			hide_feedback_span();
		  	hide_loader();
		  	error_reporting(jqXHR, textStatus, errorThrown);
		  	return false;
		  },
		  success: function(output){
			show_feedback_email_span();
			hide_feedback_span();
		  	hide_loader();
		  	return true;
		  }
		});
	}

	function get_email()
	{
		var email = $('#rankingSlashRetrieveEmail').val();
		show_loader();
		$.ajax({
		  url: blog_url + "/get_email.php",
		  data: "email="+email,
		  dataType: "json",
		  type: "GET",
		  error: function(jqXHR, textStatus, errorThrown){
			hide_feedback_email_span();
			show_email_thank_you();
		  	hide_loader();
		  	error_reporting(jqXHR, textStatus, errorThrown);
		  	return false;
		  },
		  success: function(output){
			hide_feedback_email_span();
			show_email_thank_you();
		  	hide_loader();
		  	return true;
		  }
		});

	}


	function error_reporting(jqXHR, textStatus, errorThrown)
	{
		$.ajax({
		  url: blog_url + "/report_error.php",
		  data: "errorThrown="+errorThrown+"&textStatus="+textStatus+"&responseText="+jqXHR.responseText+"&readyState="+jqXHR.readyState+"&status="+jqXHR.status,
		  dataType: "json",
		  type: "GET",
		  error: function(jqXHR, textStatus, errorThrown){
		  	//alert user that something bad happened!		  	
		  },
		  success: function(output){
		  	//reported to us, hopefully we can recover the data and treat this as nothing happened for the user.  
		  }
		});		
	}






	//#######################################################################################
	//#######################################################################################
	//#######################################################################################
	//
	//						UTILITY FUNCTIONS BELOW 
	//	
	//#######################################################################################
	//#######################################################################################
	//#######################################################################################


	function remove_brackets(input) {
	    input = input
		.replace(/{.*?}/g, "")
		.replace(/\[.*?\]/g, "")
		.replace(/<.*?>/g, "")
		.replace(/\(.*?\)/g, "");
		return $.trim(input);
	}

	function replaceNbsps(str) {
	  var re = new RegExp(String.fromCharCode(160), "g");
	  return str.replace(re, " ");
	}


	function get_extension_version() { 
		var manifest = chrome.runtime.getManifest();
		var current_version = manifest.version;
		return current_version;
	}

	function remove_html_tags(string)
	{
		var div = document.createElement("div");
		div.innerHTML = string;
		var text = div.textContent || div.innerText || "";	
		return text;
	}

	function league_id_is_a_number(leagueId)
	{
		var parsedLeagueId = parseInt(leagueId);
		if(leagueId == NaN)
		{
			leagueId = 0;
		}
		if(leagueId > 1)
		{
			return true;
		}
		return false;
	}

})(window);
