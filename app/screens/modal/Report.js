import React, { Component } from 'react';
import { View, TextInput, ScrollView, BackHandler } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'react-apollo';
import ToolBar from '@components/utils/toolbar';
import { RoundedButton, Avatar, Loading } from '@components/common';
import { Colors } from '@theme';
import { withReport } from '@services/apollo/report';
import { propType } from 'graphql-anywhere/lib/src/utilities';
import {
  FEEDABLE_TRIP,
  FEED_TYPE_OFFER,
  REPORT_COMMENT_TYPE,
  FEEDABLE_EXPERIENCE,
  GROUP_FEED_TYPE_SHARE,
  FEEDABLE_GROUP,
  FEEDABLE_SUGGESTION,
  REPORT_TYPE_USER,
} from '@config/constant';
import Date from '@components/date';
import Toast from '@components/toast';
import { getToast } from '@config/toast';
import { AppText } from '@components/utils/texts';

const styles = {
  contentWrapper: {
    flex: 1,
    backgroundColor: Colors.background.mutedBlue,
  },
  content: {
    paddingVertical: 32,
    marginBottom: 50,
  },
  label: {
    color: Colors.text.pink,
    fontWeight: 'bold',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
  },
  avatar: {
    marginRight: 12,
  },
  descriptionWraper: {
    marginTop: 16,
  },
  input: {
    height: 140,
    fontFamily: 'SFUIText-Regular',
    padding: 20,
    backgroundColor: Colors.background.fullWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.lightGray,
    marginBottom: 32,
    marginTop: 10,
  },
  infoWrapper: {
    paddingHorizontal: 20,
  },
  info: {
    paddingVertical: 14,
  },
  footer: {
    padding: 20,
    elevation: 10,
    backgroundColor: Colors.background.fullWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    marginBottom: 0,
  },
  thankyouContent: {
    paddingVertical: 20,
    marginBottom: 50,
  },
  thankyouText: {
    marginVertical: 12,
    marginHorizontal: 20,
  },
};

class Report extends Component {
  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);
    this.state = { description: '', sending: false, isReported: false, error: '' };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPress);
  }

  onBackButtonPress = () => {
    const { navigation } = this.props;
    navigation.goBack();

    return true;
  }

  onReport = () => {
    const { description } = this.state;
    const { navigation } = this.props;
    const { type, data } = navigation.state.params;

    if (!description) {
      this.setState({ error: getToast(['DESCRIPTION_REQUIRED']) });
      return null;
    }

    this.setState({ sending: true });

    const report = {
      description,
      reportable: (type === FEEDABLE_SUGGESTION || type === GROUP_FEED_TYPE_SHARE) ? 'Feed' : type,
      reportableId: this.getReportableId(type, data),
    };

    return this.props.report(report)
      .then(() => this.setState({ isReported: true, sending: false }))
      .catch(err => this.setState({ error: getToast(err), sending: false }));
  }

  getReportableId = (type, data) => {
    if (type === FEEDABLE_TRIP) {
      return data.Trip.id;
    } else if (type === FEEDABLE_GROUP) {
      return data.Group.id;
    } else if (type === REPORT_TYPE_USER) {
      return data.User.id;
    } else if (type === FEEDABLE_SUGGESTION || type === GROUP_FEED_TYPE_SHARE) {
      return data.id;
    } else if (type === REPORT_COMMENT_TYPE) {
      return data.Comment.id;
    } else if (type === FEEDABLE_EXPERIENCE) {
      return data.Experience.id;
    }

    return null;
  }

  renderUsername = username => <AppText color={Colors.text.blue} fontVariation="bold">{username}</AppText>;

  renderBodyText = () => {
    const { navigation } = this.props;
    const { data, type } = navigation.state.params;

    if (type === FEEDABLE_TRIP) {
      const { Trip } = data;
      const tripStart = Trip.TripStart && Trip.TripStart.name ?
        Trip.TripStart.name : Trip.direction;
      const tripEnd = Trip.TripEnd && Trip.TripEnd.name ?
        Trip.TripEnd.name : Trip.direction;

      return (
        <View>
          <AppText>
            {this.renderUsername(Trip.User.firstName)} {Trip.type === FEED_TYPE_OFFER ? 'offers' : 'asks'} {Trip.seats !== 0 ? `${Trip.seats} seats` : 'for a ride'}
          </AppText>
          <AppText>{tripStart} - {tripEnd}</AppText>
          <AppText size={12} color={Colors.text.gray} style={{ marginTop: 2 }}><Date format="MMM DD, YYYY">{Trip.date}</Date></AppText>
        </View>
      );
    }

    if (type === REPORT_COMMENT_TYPE) {
      return (
        <View>
          <AppText>
            <AppText>{this.renderUsername(data.Comment.User.firstName)}{' '}</AppText>
            <AppText size={12} color={Colors.text.gray} style={{ marginTop: 2 }}>
              <Date calendarTime>{data.Comment.date}</Date>
            </AppText>
          </AppText >
          <AppText>{data.Comment.text}</AppText>
        </View >
      );
    }

    if (type === FEEDABLE_EXPERIENCE || data.feedable === FEEDABLE_EXPERIENCE) {
      const { Trip } = data.Experience;
      const tripStart = Trip.TripStart && Trip.TripStart.name ?
        Trip.TripStart.name : Trip.direction;
      const tripEnd = Trip.TripEnd && Trip.TripEnd.name ?
        Trip.TripEnd.name : Trip.direction;

      return (
        <View>
          <AppText>
            Experience for {tripStart} {' - '}
            {tripEnd} {' on '}
            <Date format="MMM DD, YYYY">{Trip.date}</Date>
          </AppText>
        </View>
      );
    }

    if (type === FEEDABLE_GROUP) {
      return (
        <View>
          <AppText>{this.renderUsername(data.Group.User.firstName)}</AppText>
          <AppText>{data.Group.name}</AppText>
        </View>
      );
    }

    if (type === GROUP_FEED_TYPE_SHARE && data.feedable === FEEDABLE_TRIP) {
      const { Trip } = data;
      const tripStart = Trip.TripStart && Trip.TripStart.name ?
        Trip.TripStart.name : Trip.direction;
      const tripEnd = Trip.TripEnd && Trip.TripEnd.name ?
        Trip.TripEnd.name : Trip.direction;

      return (
        <View>
          <AppText>
            {this.renderUsername(data.User.firstName)} {' shared '}
            {this.renderUsername(Trip.User.firstName)} ride
          </AppText>
          <AppText>{tripStart} - {tripEnd}</AppText>
          <AppText size={12} color={Colors.text.gray} style={{ marginTop: 2 }}><Date format="MMM DD, YYYY">{Trip.date}</Date></AppText>
        </View>
      );
    }

    if (type === FEEDABLE_SUGGESTION) {
      const { Trip } = data;
      const tripStart = Trip.TripStart && Trip.TripStart.name ?
        Trip.TripStart.name : Trip.direction;
      const tripEnd = Trip.TripEnd && Trip.TripEnd.name ?
        Trip.TripEnd.name : Trip.direction;

      return (
        <View>
          <AppText>
            {this.renderUsername(data.User.firstName)} {' suggested '}
            {this.renderUsername(data.Trip.User.firstName)} ride
          </AppText>
          <AppText>{tripStart} - {tripEnd}</AppText>
          <AppText size={12} color={Colors.text.gray} style={{ marginTop: 2 }}><Date format="MMM DD, YYYY">{Trip.date}</Date></AppText>
        </View >
      );
    }

    if (type === REPORT_TYPE_USER) {
      return (
        <View>
          <AppText>{data.User.firstName}{data.lastName}</AppText>
        </View>
      );
    }

    return null;
  }

  renderTypeText = () => {
    const { navigation } = this.props;
    const { type, data } = navigation.state.params;

    if (type === FEEDABLE_TRIP) return 'ride';
    if (type === FEEDABLE_SUGGESTION) return 'suggestion';
    if (type === GROUP_FEED_TYPE_SHARE && data.feedable === FEEDABLE_TRIP) return 'shared ride';
    if (type === REPORT_COMMENT_TYPE) return 'comment';
    if (type === FEEDABLE_EXPERIENCE || data.feedable === FEEDABLE_EXPERIENCE) return 'experience';
    if (type === FEEDABLE_GROUP) return 'group';
    if (type === REPORT_TYPE_USER) return 'user';

    return type;
  }

  renderButton = () => {
    if (this.state.sending) {
      return (<Loading />);
    }

    return (
      <RoundedButton
        onPress={this.onReport}
        bgColor={Colors.background.pink}
        style={styles.button}
      >
        Send
      </RoundedButton>
    );
  }

  renderAvatar = () => {
    const { navigation } = this.props;
    const { data, type } = navigation.state.params;

    if (type === FEEDABLE_TRIP) {
      return (<Avatar source={{ uri: data.Trip.User.avatar }} size={60} style={styles.avatar} />);
    }

    if (type === FEEDABLE_GROUP) {
      return (
        <Avatar
          source={{ uri: data.Group.photo || data.Group.mapPhoto }}
          size={60}
          style={styles.avatar}
        />
      );
    }

    if (type === FEEDABLE_EXPERIENCE) {
      return (<Avatar
        source={{ uri: data.Experience.photoUrl }}
        size={60}
        style={styles.avatar}
      />);
    }

    return (<Avatar source={{ uri: data.User.avatar }} size={60} style={styles.avatar} />);
  }

  render() {
    const { navigation, user } = this.props;
    const { isReported, error } = this.state;

    if (!navigation.state.params) {
      return null;
    }

    return (
      <View style={styles.contentWrapper}>
        <ToolBar title="Report" />
        {
          !isReported &&
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <AppText style={styles.label}>
                You are reporting this {this.renderTypeText()}:
              </AppText>
              <View style={styles.body}>
                {this.renderAvatar()}
                <View>
                  {this.renderBodyText()}
                </View>
              </View>
              <View style={styles.descriptionWraper}>
                <Toast message={error} type="error" />
                <AppText style={styles.label}>Why do you report this?</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="Write"
                  placeholderTextColor={Colors.text.black}
                  onChangeText={description => this.setState({ description })}
                  multiline
                  underlineColorAndroid="transparent"
                  numberOfLines={4}
                  maxLength={100}
                />
              </View>
              <AppText style={styles.label}>Information about you:</AppText>
              <View style={styles.infoWrapper}>
                <View style={styles.info}>
                  <AppText>Name</AppText>
                  <AppText>{user.firstName} {user.lastName}</AppText>
                  <AppText color={Colors.text.gray}>
                    Only visible for the one reviewing your report
                  </AppText>
                </View>
                <View style={styles.info}>
                  <AppText>E-mail</AppText>
                  <AppText>{user.email}</AppText>
                  <AppText color={Colors.text.gray}>
                    Only visible for the one reviewing your report
                  </AppText>
                </View>
                <View style={styles.info}>
                  <AppText>Phone</AppText>
                  <AppText>{user.phoneNumber}</AppText>
                  <AppText color={Colors.text.gray}>
                    Only visible for the one reviewing your report
                  </AppText>
                </View>
              </View>
            </View>
          </ScrollView>
        }
        {
          isReported &&
          <View style={styles.thankyouContent}>
            <AppText style={styles.label}>Thank you</AppText>
            <AppText style={styles.thankyouText}>
              If any action is taken you will get an e-mail.
            </AppText>
            <AppText style={styles.thankyouText}>
              Thank you for remembering that we are an non-profit movement.
                  We make this work with the help of volunteers and
                  all of you who help out with the self-sustaining garden.
                  Our volunteers work as fast as they can to get to your report.
            </AppText>
            <AppText style={styles.thankyouText}>Thanks for being a part of the movement!</AppText>
          </View>
        }
        {
          !isReported &&
          <View style={styles.footer}>
            {this.renderButton()}
          </View>
        }
      </View>
    );
  }
}

const mapStateToProps = state => ({ user: state.auth.user });

Report.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        data: PropTypes.oneOfType([
          PropTypes.shape({
            id: PropTypes.number,
            Trip: PropTypes.shape({
              id: PropTypes.number,
              TripStart: PropTypes.shape({
                name: PropTypes.string,
              }),
              TripEnd: PropTypes.shape({
                name: propType.string,
              }),
              User: PropTypes.shape({
                firstName: PropTypes.string,
                avatar: PropTypes.string,
              }),
              date: PropTypes.string,
            }),
            User: PropTypes.shape({
              firstName: PropTypes.string,
              avatar: PropTypes.string,
            }),
          }),
          PropTypes.shape({
            id: PropTypes.number,
            Comment: PropTypes.shape({
              id: PropTypes.number,
              text: PropTypes.string,
              User: PropTypes.shape({
                firstName: PropTypes.string,
                avatar: PropTypes.string,
              }),
            }),
          }),
          PropTypes.shape({
            id: PropTypes.number,
            Experience: PropTypes.shape({
              id: PropTypes.number,
              name: PropTypes.string,
              photoUrl: PropTypes.string,
              User: PropTypes.shape({
                firstName: PropTypes.string,
                avatar: PropTypes.string,
              }),
            }),
          }),
          PropTypes.shape({
            id: PropTypes.number,
            Group: PropTypes.shape({
              id: PropTypes.number,
              photo: PropTypes.string,
              User: PropTypes.shape({
                firstName: PropTypes.string,
                avatar: PropTypes.string,
              }),
            }),
          }),
        ]).isRequired,
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  report: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phoneNumber: PropTypes.string.isRequired,
  }).isRequired,
};

export default compose(withReport, connect(mapStateToProps))(Report);
