// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";
import "../javascripts/_vendor/angular.js";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import metacoin_artifacts from '../../build/contracts/MetaCoin.json'
import campaign_artifacts from '../../build/contracts/Campaign.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var MetaCoin = contract(metacoin_artifacts);
var Campaign = contract(campaign_artifacts);


// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

var app = angular.module('CampaignApp', []);

app.config(function($locationProvider) {
  $locationProvider.html5Mode({
  enabled: true,
  requireBase: false
  });
});

app.controller("CampaignController",
  [ '$scope', '$location', '$http', '$q', '$window', '$timeout',
  function($scope, $location, $http, $q, $window, $timeout) {


// Everything we do will be inside the App Controller

$scope.contributionLog=[];

      Campaign.deployed()
      .then(function(_instance) {
        $scope.contract = _instance;
        console.log("The contract:", $scope.contract);

        // dont want this to happen before the contract is known

        $scope.contributionWatcher = $scope.contract.LogContribution({}, {fromBlock: 0})
        .watch(function(err, newContribution) {

            if(err) {
              console.log("Error watching contriubution events", err);

            }else{
              console.log("Contribution", newContribution);
              newContribution.args.amount = newContribution.args.amount.toString(10); 
              $scope.contributionLog.push(newContribution);
              return $scope.getCampaignStatus();

            }

          })


        return $scope.getCampaignStatus();
        
      })

      //Contribute to the campaign

      $scope.contribute = function() {
        if(parseInt($scope.newContribution)<=0) return;
        console.log("contribution", $scope.newContribution);
        var newContribution = $scope.newContribution;
        $scope.newContribution = 0;
        $scope.contract.contribute({from: $scope.account, value: parseInt(newContribution), gas: 900000})
        .then(function(txn) {
          console.log("Transaction Receipt", txn);
          return $scope.getCampaignStatus();

        })
        .catch(function(error){
          console.log("Error processing contribution", error);



        })

      }


      //Get the campaign status

      $scope.getCampaignStatus = function() {
          return $scope.contract.fundsRaised({from: $scope.account})
          .then(function(_fundsRaised) {
            console.log("fundsRaised: ", _fundsRaised.toString(10));
            $scope.campaignFundsRaised = _fundsRaised.toString(10);
            return $scope.contract.goal({from: $scope.account});            
          })
          .then(function(_goal) {
            console.log("goal: ", _goal.toString(10));
            $scope.campaignGoal = _goal.toString(10);
            return $scope.contract.deadline({from: $scope.account});
          })
          .then(function(_deadline) {
            console.log("deadline: ", _deadline.toString(10));
            $scope.campaignDeadline = _deadline.toString(10);
            return $scope.contract.owner({from: $scope.account});
          }).then(function(_owner) {
            console.log("owner: ", _owner.toString(10));
            $scope.campaignOwner = _owner.toString(10);
            return $scope.contract.isSuccess({from: $scope.account});
          }).then(function(_isSuccess) {
            console.log("isSuccess: ", _isSuccess);
            $scope.campaignIsSuccess = _isSuccess;
            return $scope.contract.hasFailed({from: $scope.account});
          }).then(function(_hasFailed) {
            console.log("hasFailed: ", _hasFailed);
            $scope.campaignHasFailed = _hasFailed;
            return $scope.getCurrentBlockNumber();
          })
      }


      $scope.getCurrentBlockNumber = function() {
        web3.eth.getBlockNumber(function(err, bn) {
          if(err) {
              console.log("error getting block number", err);
          } else {
              console.log("Current Block Number", bn);
              $scope.blockNumber = bn;
              $scope.$apply();
          }
        })

      }

      web3.eth.getAccounts(function(err, accs) {
      if(err !=null) {
      alert("There was an error fetching your accounts.");
      return;
      }
      if(accs.length==0) {
      alert("Couldn't get any accounts. Make sure your Ethereum client is configured correctly.")
      return;
      }
      $scope.accounts = accs;
      $scope.account = $scope.accounts[0];
      console.log("using account", $scope.account);

      web3.eth.getBalance($scope.account, function(err, _balance){
        $scope.balance = _balance.toString(10);
        console.log("balance", $scope.balance);
        $scope.balanceInEth = web3.fromWei($scope.balance, "ether");
        $scope.$apply();
      })

     });


  }]);

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  MetaCoin.setProvider(web3.currentProvider);
  Campaign.setProvider(web3.currentProvider);

});
