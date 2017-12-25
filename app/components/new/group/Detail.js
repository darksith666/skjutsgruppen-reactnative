import React, { PureComponent } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import { connect } from 'react-redux';
import { submitComment } from '@services/apollo/comment';
import { withGroupFeed } from '@services/apollo/group';
import { withLeaveGroup } from '@services/apollo/notification';
import { withShare } from '@services/apollo/auth';
import { Wrapper, Loading } from '@components/common';
import { Navbar } from '@components/new/common';
import Colors from '@theme/colors';
import GroupFeed from '@components/new/group/feed/list';
import GroupImage from '@components/new/group/groupImage';
import Share from '@components/common/share';
import MapToggle from '@components/new/group/mapToggle';

const GroupFeedList = withGroupFeed(GroupFeed);

const styles = StyleSheet.create({
  leaveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    bottom: 12,
    height: 32,
    width: 120,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background.fullWhite,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  leaving: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leavingText: {
    marginRight: 4,
  },
  leaveText: {
    fontSize: 13,
    color: Colors.text.darkGray,
  },
  footer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
  },
  footerContent: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    backgroundColor: '#f3f3ed',
    borderTopWidth: 2,
    borderColor: '#cececf',
    paddingVertical: 9,
    paddingLeft: 24,
    paddingRight: 12,
  },
  msgInput: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    borderWidth: 1,
    borderColor: '#b1abab',
    paddingHorizontal: 12,
  },
  send: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.25,
  },
  sendText: {
    color: '#00aeef',
    fontWeight: 'bold',
  },
});

class Detail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = ({ loading: false, leaveLoading: false, error: '', comment: '', modalDetail: {}, modalType: '', isOpen: false });
  }

  onSubmit = () => {
    this.setState({ loading: true });
    const { submit, group } = this.props;
    const { comment } = this.state;
    const validation = this.checkValidation();

    if (validation.pass()) {
      try {
        submit(null, group.id, comment).then(() => {
          Alert.alert('Success!', 'Comment added');
          this.setState({ comment: '', loading: false });
        }).catch((err) => {
          this.setState({ loading: false, error: err.message });
        });
      } catch (err) {
        this.setState({ loading: false, error: err.message });
      }
    } else {
      Alert.alert('Alert!', validation.errors.join('\n'));
      this.setState({ loading: false });
    }
  }

  onSharePress = (modalType, modalDetail) => {
    this.setState({ isOpen: true, modalType, modalDetail });
  }

  onShare = (share) => {
    this.props.share({ id: this.state.modalDetail.id, type: this.state.modalType === 'group' ? 'Group' : 'Trip', share })
      .then(() => this.setState({ isOpen: false }))
      .catch(console.warn);
  };

  onClose = () => {
    this.setState({ isOpen: false });
  }

  onCommentPress = (id) => {
    const { navigation } = this.props;
    navigation.navigate('UserProfile', { profileId: id });
  }

  onPress = () => {
    const { group, navigation } = this.props;
    navigation.navigate('UserProfile', { profileId: group.User.id });
  }

  onMapPress = () => {
    const { navigation } = this.props;
    const { group } = navigation.state.params;
    const coordinates = {
      start: group.TripStart,
      end: group.TripEnd,
      stops: group.Stops,
    };

    navigation.navigate('Route', { coordinates });
  }

  leaveGroup = () => {
    const { group, leaveGroup, refresh } = this.props;
    this.setState(
      { leaveLoading: true },
      () => leaveGroup(group.id)
        .then(refresh)
        .catch(console.warn),
    );
  }

  checkValidation() {
    const errors = [];
    const { comment } = this.state;

    if (comment === '') {
      errors.push('Comment is required.');
    }

    return {
      pass: () => (errors.length === 0),
      errors,
    };
  }

  isGroupJoined = () => {
    const { group, user } = this.props;

    if (user.id === group.User.id) {
      return false;
    }

    let hasMember = false;

    group.GroupMembers.forEach((member) => {
      if (member && member.id === user.id) {
        hasMember = true;
      }
    });

    return hasMember;
  }

  goBack = () => {
    const { navigation } = this.props;
    navigation.goBack();
  }

  header = (leaveLoading) => {
    const { group } = this.props;
    const { error } = this.state;

    let image = null;
    if (group.photo) {
      image = (<GroupImage imageURI={group.photo} name={group.name} />);
    } else if (group.mapPhoto) {
      image = (<GroupImage imageURI={group.mapPhoto} name={group.name} />);
    } else {
      image = (<GroupImage imageURI={require('@assets/feed-img.jpg')} name={group.name} />);
    }

    return (
      <View>
        {image}
        {this.isGroupJoined() && this.renderLeaveButton(leaveLoading)}
        <MapToggle handlePress={this.onMapPress} />
        {error !== '' && <View><Text>{error}</Text></View>}
      </View>);
  }

  renderButton = () => {
    const { loading } = this.state;
    if (loading) {
      return (<View style={styles.loadingWrapper}><Loading /></View>);
    }
    return (
      <TouchableOpacity onPress={this.onSubmit}>
        <Text style={styles.sendText}> Send</Text>
      </TouchableOpacity>);
  }

  renderCommentForm() {
    return (
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TextInput
            onChangeText={comment => this.setState({ comment })}
            value={this.state.comment}
            style={styles.msgInput}
            placeholder="Write something..."
            autoCorrect={false}
            autoCapitalize={'none'}
            returnKeyType={'done'}
            placeholderTextColor="#666"
            underlineColorAndroid="transparent"
          />

          <View style={styles.send}>
            {this.renderButton()}
          </View>
        </View>
      </View>
    );
  }

  renderLeaveButton = leaveLoading => (
    <View style={styles.leaveButton}>
      {
        leaveLoading ?
          <View style={styles.leaving}>
            <Text style={[styles.leaveText, styles.leavingText]}>Leaving</Text>
            <Loading />
          </View>
          :
          <TouchableWithoutFeedback
            onPress={this.leaveGroup}
          >
            <View><Text style={styles.leaveText}> Leave group </Text></View>
          </TouchableWithoutFeedback>
      }
    </View>
  );

  renderShareModal() {
    return (
      <Modal
        visible={this.state.isOpen}
        onRequestClose={() => this.setState({ isOpen: false })}
        animationType="slide"
      >
        <ScrollView>
          <Share
            modal
            showGroup={this.state.modalType !== 'group'}
            onNext={this.onShare}
            onClose={this.onClose}
          />
        </ScrollView>
      </Modal>
    );
  }

  render() {
    const { group, navigation } = this.props;
    const header = this.header(this.state.leaveLoading);
    return (
      <Wrapper bgColor={Colors.background.cream}>
        <Navbar handleBack={this.goBack} />
        <GroupFeedList
          header={header}
          navigation={navigation}
          groupId={group.id}
        />
        {this.renderCommentForm()}
        {this.renderShareModal()}
      </Wrapper>
    );
  }
}

Detail.propTypes = {
  share: PropTypes.func.isRequired,
  leaveGroup: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired,
  group: PropTypes.shape({
    id: PropTypes.number.isRequired,
    photo: PropTypes.string.isRequired,
    GroupMembers: PropTypes.array.isRequired,
    User: PropTypes.object.isRequired,
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }).isRequired,
  refresh: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({ user: state.auth.user });

export default compose(withShare, withLeaveGroup, submitComment, connect(mapStateToProps))(Detail);